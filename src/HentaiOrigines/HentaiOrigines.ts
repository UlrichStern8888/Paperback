import {
    ContentRating,
    SourceInfo,
    BadgeColor,
    SourceIntents
} from '@paperback/types'

import {
    Madara
} from '../templates/madara/base'

const DOMAIN: string = 'https://hentai-origines.fr'


export const HentaiOriginesInfo: SourceInfo = {
    version: "2.2",
    language: "FR",
    name: 'HentaiOrigines',
    icon: 'icon.png',
    description: `Extension that pulls mangas from ${DOMAIN}`,
    author: 'Moomooo95',
    authorWebsite: 'https://github.com/Moomooo95',
    contentRating: ContentRating.EVERYONE,
    websiteBaseURL: DOMAIN,
    sourceTags: [
        {
            text: 'FR',
            type: BadgeColor.GREY
        },
    ],
    intents: SourceIntents.MANGA_CHAPTERS | SourceIntents.HOMEPAGE_SECTIONS | SourceIntents.CLOUDFLARE_BYPASS_REQUIRED
}

export class HentaiOrigines extends Madara {
    base_url = DOMAIN
    lang_code = HentaiOriginesInfo.language!
    override source_path: string = "manga"
    override alt_ajax: boolean = true
    override cloudflare_domain: boolean = false
    override description_selector: string = ".summary__content p"
    override search_fileds_name_list: { default: string; new: string }[] = [
        { default: "Author", new: "Auteur" },
        { default: "Artist", new: "Artiste" },
        { default: "An", new: "Année" },
    ]
    override genres_conditions_name_list: { default: string; new: string }[] = [
        { default: "Au moins un des tag sélectionné", new: "OU (ayant au moins un des genres sélectionné)" },
        { default: "Tous les tags sélectionnés", new: "ET (ayant tous les genres sélectionné)" }
    ]
    override adult_content_name_list: { default: string; new: string }[] = [
        { default: "Oui", new: "Tout" },
        { default: "Pas de contenus pour adulte", new: "Aucun contenu pour adulte" },
        { default: "Seulement du contenus pour adulte", new: "Seulement du contenu pour adulte" }
    ]
    // Méthode modifiée pour gérer le base64 dans getIntMangaId
    override async getIntMangaId(mangaId: string) {
        const request = App.createRequest({
            url: `${this.base_url}/${this.source_path}/${mangaId}`,
            method: 'GET'
        });

        const response = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(response.status);

        const $ = this.cheerio.load(response.data);

        // Extraire le contenu base64 du script
        const base64Script = $('script#wp-manga-js-extra').attr('src')?.split(',')[1];

        if (!base64Script) {
            throw new Error("Impossible de trouver le script encodé en base64");
        }

        // Décoder le contenu base64
        const decodedScript = Buffer.from(base64Script, 'base64').toString('utf-8');

        // Extraire manga_id du script décodé
        const mangaIdMatch = decodedScript.match(/"manga_id":"(\d*)"/);

        if (!mangaIdMatch) {
            throw new Error("manga_id non trouvé dans le script décodé");
        }

        // Retourner l'ID du manga
        return mangaIdMatch[1];
    }
}
