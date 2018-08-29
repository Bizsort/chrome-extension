import { IdNameNodeType as IdName, NodeType } from '../../src/model/foundation'
import { ViewModel } from '../../src/viewmodel'
import { Config } from './select'

export class Edit extends ViewModel {
    IsValueRequired = true
        
    protected _groupId;
    public get GroupId(): number {
        return this._groupId;
    }

    _config: Config;
    set Config(config: Config) {
        this._config = config;
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

    Populate(groupId: number = 0) {
        if (typeof this._groupId === 'undefined' || this._groupId !== groupId) {
            this._groupId = groupId;
            var promise = this._populate();
            /*if (this._select)
                this._select.Populate(this._groupId);*/
            return promise;
        }
    }

    _populate() {
        if (this._groupId == 0 && this.Scope && this.Scope.Name) {
            this.Items = [{ Id: this.Scope.Id, Name: this.Scope.Name, NodeType: NodeType.Super }];
        }
        else if (this._groupId > 0) {
            return this._service.GetPath(this._groupId, null, (groups) => {
                this.Items = groups;
            });
        }
    }

    Validate (proceed) {
        if (this._groupId > 0) {
            this._service.Get(this._groupId, (group: IdName) => {
                proceed(((group.NodeType & NodeType.Super) == 0 && (group.NodeType & NodeType.Class) > 0) || ((group.NodeType & NodeType.Super) > 0 && this.AllowSelectSuper));
            });
        }
        else
            proceed(!this.IsValueRequired);
    }
}