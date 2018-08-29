import * as RichText from '../../src/viewmodel/richtext'
import * as Url from '../../src/system/url'

export interface HTMLRichTextElement extends HTMLDivElement {
    html: string;
    text: string;
}

export const RTE = <any>(() => {
    var richText = new RichText.Converter();

    return {
        cleanseRichText: (richText/*entity*/, url, suppressError?) => {
            try {
                if (typeof url == 'string') {
                    url = {
                        origin: url.replace(/\/+$/, ''),
                        pathname: "/"
                    };
                }
                var html = RTE.toXHtml(richText/*entity.RichText*/, url, suppressError);
            }
            catch (e) {
                if (suppressError)
                    html = '<p>' + Error.getMessage(e) + '</p>';
                else
                    throw e;
            }

            /*if (html)
                entity.RichText = html;*/
            return html;
        },

        /*http://stackoverflow.com/questions/4102744/jquery-html-returns-invalid-img
        https://github.com/GeReV/NSoup
        https://github.com/MindTouch/SGMLReader
        */
        toXHtml: (html, url?) => {
            return richText.FromHtml(String.toDOM(html), {
                styleAttributes: RichText.Style.Attributes.External,
                url: url
            });
        },

        parseTextFeatures: (value, selection) => {
            var url = Url.windowLocation();
            var options: RichText.IFromHtml = {
                //children: true,
                features: true,
                defaultStyles: 0,
                url: url
            };
            var html = richText.FromHtml(selection.Element.innerHTML/* || String.toDOM(selection.Element)*/, options);
            return options.features;
        }
    };
})();