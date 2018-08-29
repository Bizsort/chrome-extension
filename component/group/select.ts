import { IdName } from '../../src/model'
import { INodeType, Node, NodeType, SubType } from '../../src/model/foundation'
import { IView, IDialogView, ViewModel } from '../../src/viewmodel'
import { Autocomplete } from './autocomplete'
export { IView, ViewModel }

export interface Config {
    Service;
    Scope?;
    MemberType?: (group: IdName) => number;
    AllowSelectSuper?;
}

export class Select extends ViewModel {
    ShowNested = true;
    ShowParentLock = true;
    ShowSingleParent = false;

    constructor(view: IView, protected _config?: Config) {
        super(view);
        if (_config)
            this.Config = _config;
    }

    set Config(config: Config) {
        this._config = config;
        this.ShowParentLock = !this.AllowSelectSuper;
        if (this.Scope) {
            this.ShowSingleParent = true;
            if (this.ParentGroup.Id == 0)
                this.ParentGroup = this.Scope;
        }
    }

    get _service() {
        return this._config && this._config.Service;
    }
    get Scope() {
        return this._config && this._config.Scope;
    }
    get MemberType() {
        return this._config && this._config.MemberType;
    }
    get AllowSelectSuper() {
        return (this._config && this._config.AllowSelectSuper) || false;
    }

    _text: string = '';
    get Text(): string {
        return this._text;
    }
    set Text(text: string) {
        if (this._text != text) {
            this._text = text;
            this.notifyProperty('Text', this._text);
        }
    }

    _autocomplete: Autocomplete;
    get Autocomplete(): Autocomplete {
        return this._autocomplete;
    }

    Initialize(options) {
        super.Initialize(options);
        this._autocomplete = this.getViewModel<Autocomplete>("autocomplete");
        if (this._autocomplete)
            this._autocomplete.Initialize({
                Master: this,
                Populate: (text, callback) => {
                    this._service.Autocomplete((this.Scope/*ParentGroup*/ ? this.Scope.Id : 0), text, this.Scope, callback);
                },
                ItemSelected: (group) => {
                    var command = this.GetGroupAction(group);

                    if (command) {
                        this.selectGroup(group, command);
                        this.Text = '';
                    }
                }
            });
    }

    protected _items;
    set Items(items) {
        if (this._items != items) {
            this._items = items;
            this.notifyProperty("Items", this._items);
        }
    }
    get Items() {
        return this._items;
    }

    _parentGroup: IdName = { Id: 0, Name: '' };
    get ParentGroup(): IdName {
        return this._parentGroup;
    }
    set ParentGroup(parentGroup: IdName) {
        if (this.setParentGroup(parentGroup))
            this.notifyProperty('ParentGroup', this._parentGroup);
    }
    setParentGroup(parentGroup: IdName) {
        if (this._parentGroup != parentGroup) {
            this._parentGroup = parentGroup;
            return true;
        }
    }

    _parentItems = null;
    set ParentItems(parentItems) {
        if (this._parentItems != parentItems) {
            this._parentItems = parentItems;
            this.notifyProperty('ParentItems', this._parentItems);
        }
    }
    get ParentItems() {
        return this._parentItems;
    }

    _parentLock = false;
    set ParentLock(parentLock) {
        if (this._parentLock != parentLock) {
            this._parentLock = parentLock;
            this.notifyProperty('ParentLock', this._parentLock);
        }
    }
    get ParentLock() {
        return this._parentLock;
    }

    protected parentAction(group: INodeType) {
        return group.NodeType && (this.AllowSelectSuper || !group.Locked);
    }

    protected parentLocked(group: INodeType) {
        return !group.NodeType || (group.Locked && this.ShowParentLock);
    }

    CanSelectParent(group) {
        return group.Id != this.ParentGroup.Id || (group.Id && this.parentAction(group)) || (group == this.Scope && this.Scope.Name) ? true : false
    }

    SelectParent(group) {
        if (group.Id != this.ParentGroup.Id)
            this.selectGroup(group, "Populate");
        else if ((group.Id != 0 && this.parentAction(group)) || (group == this.Scope && this.Scope.Name))
            this.selectGroup(group, "Select");
    }

    GetGroupAction(group: Node) {
        if (group.HasChildren || (group.Children != null && group.Children.length > 0))
            return "Populate";
        else if ((!group.HasChildren && !group.Locked) || ((group.NodeType & NodeType.Super) > 0 && this.AllowSelectSuper))
            return "Select";
        //else
        //    return null;
    }

    SelectGroup(group: Node) {
        var action = this.GetGroupAction(group);

        if (action)
            this.selectGroup(group, action);
    }

    _selected: IdName;
    get Selected(): IdName {
        return this._selected;
    }
    set Selected(selected: IdName) {
        if (this.setSelected(selected))
            this.notifyProperty('Selected', this._selected);
    }
    setSelected(selected: IdName) {
        if (this._selected != selected) {
            this._selected = selected;
            return true;
        }
    }
    ResetSelected() {
        if (this._selected)
            this.setSelected(null);
    }

    protected selectGroup(group: IdName, action: string) {
        switch (action) {
            case "Populate":
                this._populate(group.Id, SubType.Children + (this.ShowNested ? SubType.GrandChildren : 0), (this.MemberType && this.MemberType(group)) || 0);
                break;
            case "Select":
                if (group.Id != this.ParentGroup.Id)
                    this._populate(group.Id, SubType.Siblings + SubType.Children + (this.ShowNested ? SubType.GrandChildren : 0), (this.MemberType && this.MemberType(group)) || 0, true);
                this.Selected = group;
                if ((<IDialogView>this.View).Close)
                    (<IDialogView>this.View).Close();
                break;
        }
    }

    Populate(groupId: number) {
        if (!this._selected || this._selected.Id != groupId)
            return this._populate(groupId, SubType.Siblings + SubType.Children + (this.ShowNested ? SubType.GrandChildren : 0), (this.MemberType && this.MemberType(null)) || 0, true, true);
    }

    _populate(groupId: number, type: number, memberType: number, reflectParent?, init?: boolean) {
        var scopeId = this.Scope ? this.Scope.Id : 0, selected;
        if (this.Scope && this.Scope.Id > 0 && groupId == this.Scope.Id) {
            type &= ~SubType.Siblings;
            selected = this.Scope;
        }
        return this._service.PopulateWithChildren(groupId, type, memberType, (node) => {
            if (groupId != scopeId) {
                this._setParents(node, init);
            }
            else if (reflectParent || this.ParentGroup != this.Scope || this.ParentGroup.Id != scopeId/*this._parentGroup != 0*/)
                this._resetParents(node);
            if ((type & SubType.Children) > 0) {
                this.Items = node.Children;
            }
            else
                throw 'Must populate Children'; //Items = null;
            if (!selected)
                selected = node.Id === groupId ? { Id: node.Id, Name: node.Name } : this.Items.find(i => i.Id === groupId);
            if (selected && init) {
                this.setSelected(selected);
                this.notifyProperty('Selected', this._selected, null, { init: true });
            }
            else if (!selected)
                throw 'Returned sequence does not contain item ' + groupId;
        });
    }

    _setParents(node, init?: boolean) {
        var parent = node;
        var parents = new Array();
        var scopeId = this.Scope ? this.Scope.Id : 0;
        while (parent) {
            parents.push(parent);
            parent = parent.Id > scopeId ? parent.Parent : null;
        }
        if (parents.length > 0) {
            var parentGroup = parents[0].Id != scopeId || !this.Scope ? parents[0] : this.Scope;
            if (init) {
                this.setParentGroup(parentGroup);
                this.notifyProperty('ParentGroup', this._parentGroup, null, { init: true });
            }
            else
                this.ParentGroup = parentGroup;
            this.ParentItems = parents.reverse(); //To use command, Param and #index without linking
            this.reflectParentLock(this.ParentItems);
        }
        else
            throw "Array is empty: parents";
    }

    _resetParents(node) {
        var parent = node;
        if (this.ShowSingleParent) { //Assuming that root node Name has been updated with scope Name in PopulateWithChildren
            var scopeId = this.Scope ? this.Scope.Id : 0;
            while (parent && parent.Id != scopeId) {
                parent = parent.Parent;
            }
        }
        else
            parent = null;
        this.ParentGroup = this.Scope || parent || { Id: 0, Name: '' };
        if (parent) {
            this.ParentItems = [parent];
        }
        else {
            this.ParentItems = null;
        }
        this.reflectParentLock(this.ParentItems);
    }

    reflectParentLock(parents) {
        if (parents != null && parents.length > 0 && this.parentLocked(parents[parents.length - 1]))
            this.ParentLock = true;
        else
            this.ParentLock = false;
    }
}