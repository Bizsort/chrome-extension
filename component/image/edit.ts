import { ViewModel } from '../../src/viewmodel'
import { CachedImage, Image, ImageSettings } from '../../src/model'
import { Cache as ImageCache } from '../../src/service/image'
import { ImageCollection } from '../../src/model/admin'

export class Edit extends ViewModel {

    protected _images: ImageCollection;
    set Images(images) {
        if (images && images.Refs) {
            if (this._images != images) {
                if (images.Refs.length) {
                    for (var i = 0; i < images.Refs.length; i++) {
                        if (!images.Refs[i].ImageRef)
                            images.Refs[i].ImageRef = Image.GetImageRef(images.Entity, images.Refs[i].Id, ImageSettings.Small);
                    }
                }
                this._images = images;
                //Raise before View notifyProperty, so we can set properties prior to binding notification
                this.PropertyChange.Invoke(this, { name: "ImageCount", value: this.Images.Refs.length });
                this.notifyProperty("Images", this._images);
            }
        }
    }
    get Images(): ImageCollection {
        return this._images;
    }

    _enabled = true;
    set Enabled(enabled) {
        if (this._enabled != enabled) {
            this._enabled = enabled;
            this.notifyProperty("Enabled", this._enabled);
        }
    }
    get Enabled() {
        return this._enabled;
    }

    _maxImages = 0;
    set MaxImages(maxImages) {
        if (this._maxImages != maxImages) {
            this._maxImages = maxImages;
            this.notifyProperty("MaxImages", this._maxImages);
        }
    }
    get MaxImages() {
        return this._maxImages;
    }

    AddImage(image: CachedImage, reset?: boolean) {
        if (this.Enabled && image && image.Preview) {
            if (reset || this._maxImages === 1) {
                ImageCache.Clear();
                if (this.Images.Refs.length) {
                    for (var i = 0, l = this.Images.Refs.length; i < l; i++) {
                        if (this.Images.Refs[i].Id)
                            this.Images.Deleted.push(this.Images.Refs[i].Id);
                    }
                    this.arraySplice('Images.Refs', 0, this.Images.Refs.length); //this.Images.Refs.length = 0;
                }
            }

            var preview = image.Preview;
            var token = ImageCache.Add(image);

            this.arrayPush('Images.Refs', {
                Token: token,
                IsOwned: true,
                ImageRef: preview.Content,
                Width: preview.Width,
                Height: preview.Height
            }); //this.Images.Refs.push(image);

            if (this.Images.Refs.every(i => !i.IsDefault))
                this.MakeDefault(this.Images.Refs[this.Images.Refs.length - 1], this.Images.Refs.length - 1);

            this.PropertyChange.Invoke(this, { name: "ImageCount", value: this.Images.Refs.length });
        }
    }

    RemoveImage(image: ImageCollection.Image, index: number) {
        if (this.Enabled && this.Images.Refs.length > index && image.IsOwned) {
            this.arraySplice('Images.Refs', index, 1) //this.Images.Refs.splice(index, 1);

            if (image.Id)
                this.Images.Deleted.push(image.Id);
            if (image.IsDefault && this.Images.Refs.length)
                this.MakeDefault(this.Images.Refs[0], 0); //this.Images.Refs[0].IsDefault = true;
            if (image.Token)
                delete ImageCache[image.Token];

            this.PropertyChange.Invoke(this, { name: "ImageCount", value: this.Images.Refs.length });
        }
    }

    MakeDefault(image: ImageCollection.Image, index: number) {
        if (this.Enabled && !image.IsDefault) {
            for (var i = 0, l = this.Images.Refs.length; i < l; i++) {
                if (i == index)
                    this.arraySet('Images.Refs', i, true, 'IsDefault');
                else if (this.Images.Refs[i].IsDefault)
                    this.arraySet('Images.Refs', i, false, 'IsDefault');
            }
        }
    }
}