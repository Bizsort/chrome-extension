import { Page } from '../../src/page'
import { IView, ViewModel } from '../../src/viewmodel'
import { Pager as Pager$, Shell } from '../../src/viewmodel/list/view'

export namespace Pager {
    export interface IButton {
        CanMove?: boolean;
        href?: string;
    }

    export interface IPageButton {
        PageNumber: number;
        Selected?: boolean;
        href?: string;
    }
}

//Component.Image.View
export class Pager extends ViewModel {
    constructor(view: IView, master?: Pager$) {
        super(view);
        if (master)
            this.Master = master;
    }

    _master: Pager$;
    set Master(master: Pager$)
    {
        if (master && this._master != master) {
            this._master = master;
            this._master.PropertyChange.AddHandler(this._pager_propertyChange.bind(this));
        }
    }
    get Master(): Pager$ {
        return this._master;
    }

    NumericButtonCount = 5;
    protected _pageCount = 0;
    get PageCount(): number {
        return this._pageCount;
    }
    set PageCount(pageCount: number) {
        if (this._pageCount != pageCount) {
            this._pageCount = pageCount;
            this.notifyProperty("PageCount", this._pageCount);
        }
    }
    IsTotalItemCountFixed = false;
        
    FirstPage: Pager.IButton = { };
    PreviousPage: Pager.IButton = { };
    NextPage: Pager.IButton = { };
    LastPage: Pager.IButton = { };
    protected _pageButtons: Pager.IPageButton[] = [];
    set PageButtons(pageButtons) {
    }
    get PageButtons() {
        return this._pageButtons;
    }

    protected _pager_propertyChange(sender, propertyName) {
        switch (propertyName) {
            case 'TotalItemCount':
                this._updateAll();
                break;

            case 'ItemCount':
            case 'PageSize':
                this._updatePageCount();
                this._updateAll();
                return;

            case 'PageIndex':
                this._updatePageButtonIndexes();
                this._enableDisableButtons();
                return;

            case 'CanChangePage':
                this._enableDisableButtons();
                break;

            default:
                return;
        }
    }

    protected _updatePageCount () {
        if (this._master.PageSize && this._master.ItemCount) {
            this.PageCount = Math.max(1, Math.ceil(this._master.ItemCount / this._master.PageSize));
        }
        else {
            this.PageCount = 0;
        }
    }

    protected get _pageButtonIndex () : number {
        return Math.round(Math.min(Math.max((this._master.PageIndex + 1) - (this.NumericButtonCount / 2), 1), Math.max(this.PageCount - this.NumericButtonCount + 1, 1)));
    }

    protected _updateAll () {
        this._updatePageButtons();
        this._enableDisableButtons();
    }

    protected _updatePageButtons () {
        var num = Math.min(this.NumericButtonCount, this.PageCount);

        if (this._pageButtons) {
            var count = this._pageButtons.length;
            while (count < num) {
                this.arrayPush('PageButtons', {
                    PageNumber: 0
                }); //this._pageButtons.push({ PageNumber: 0 });
                count++;
            }
            while (count > num) {
                this.arraySplice('PageButtons', 0, 1) //this._pageButtons.splice(0, 1);
                count--;
            }
            this._updatePageButtonIndexes();
        }
    }

    protected _updatePageButtonIndexes () {
        //Maybe incomplete
        if (this._pageButtons) {
            var buttonStartIndex = this._pageButtonIndex;
            var num2 = Math.min(this.NumericButtonCount, this.PageCount);
            var flag = false;
            var buttonIndex = buttonStartIndex;
            var token = Page.Current.Token.Clone;
            for (var i = 0, l = this._pageButtons.length; i < l; i++) {
                var button = this._pageButtons[i];
                if (this._master.PageIndex == (buttonIndex - 1)) {
                    if (!button.Selected)
                        this.arraySet('PageButtons', i, true, 'Selected'); //button.Selected = true;
                }
                else if (button.Selected)
                    this.arraySet('PageButtons', i, false, 'Selected'); //button.Selected = false;
                token.Page = (buttonIndex - 1);
                this.arraySet('PageButtons', i, buttonIndex, 'PageNumber'); //button.PageNumber = buttonIndex;
                this.arraySet('PageButtons', i, Shell.Href(token), 'href'); //button.href = Navigation.Shell.Href(token);
                buttonIndex++;
            }
            if (this.PreviousPage.CanMove && this._master.PageIndex > 0) {
                token.Page = (this._master.PageIndex - 1);
                this.PreviousPage.href = Shell.Href(token);
            }
            else
                this.PreviousPage.href = null;
            if (this.NextPage.CanMove && (this._master.PageIndex + 1) < this._master.PageCount) {
                token.Page = (this._master.PageIndex + 1);
                this.NextPage.href = Shell.Href(token);
            }
            else
                this.NextPage.href = null;
              
            //this.notifyProperty("PageButtons", this._pageButtons);
        }
    }

    protected _enableDisableButtons () {
        var needPage = this._master.PageSize > 0;
        if (!needPage || !this._master.CanChangePage) {
            this._setCannotChangePage(needPage);
        }
        else {
            this._setCanChangePage();
            this._updateCanMoveFirstAndPrevious();
            this._updateCanMoveNextAndLast();
        }
    }

    protected _setCannotChangePage(needPage) {
        //if (this._currentPageTextBox && !needPage) {
        //    this._currentPageTextBox.Text = '';
        //}
        //setDisabled(this._currentPageTextBox, true);
        this.setProperty("FirstPage.CanMove", false);
        this.setProperty("PreviousPage.CanMove", false);
        this.setProperty("NextPage.CanMove", false);
        this.setProperty("LastPage.CanMove", false);
    }

    protected _setCanChangePage (needPage?) {
        //setDisabled(this._currentPageTextBox, false);
        //if (this._currentPageTextBox) {
        //    this._currentPageTextBox.Text = (this._pager.PageIndex + 1)/*.ToString(CultureInfo.CurrentCulture)*/;
        //}
    }

    protected _updateCanMoveFirstAndPrevious() {
        this.setProperty("FirstPage.CanMove", this._master.PageIndex > 0);
        this.setProperty("PreviousPage.CanMove", this.FirstPage.CanMove);
    }

    protected _updateCanMoveNextAndLast() {
        this.setProperty("NextPage.CanMove", (!this.IsTotalItemCountFixed || (this._master.TotalItemCount == -1)) || (this._master.PageIndex < (this._master.PageCount - 1)));
        this.setProperty("LastPage.CanMove", this._master.TotalItemCount != -1 && (this._master.PageIndex < (this._master.PageCount - 1)));
    }
}