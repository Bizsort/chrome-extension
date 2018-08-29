export { Cache } from './session/cache'
import { User, SigninFlags, SigninStatus, ServiceProvider } from './session/user'
import { Session as SessionService } from './service/session'
export { SigninFlags, SigninStatus, ServiceProvider, SessionService }

export enum CacheType {
    MasterDictionary = 1,
    PersonalList = 2,
    Community = 3,
    CommunityInvitation = 4,
    CommunityMembership = 4,
    CommunityRequest = 5,
    Connection = 6,
    ConnectionInvitation = 7,
    BusinessCategory = 8,
    CommunityCategory = 9,
    CommunityForum = 10,
    Promotion = 11,
    ProductTag = 12,
    MessageFolder = 13,
    ConversationPeer = 14,
    LocationSettings = 15,
    UserName = 16,
}

interface SessionContext {
    EnterPromise?: any;
    Id?: string;
}

export var Context: SessionContext = {};

export var Storage = window.sessionStorage;

export class Session {
    static _user: User;
    static get User(): User {
        return Session._user || function () {
            Session._user = new User();
            return Session._user;
        }();
    }
}

export namespace Session {
    export const Enabled = Storage ? true : false;

    export var Enter = SessionService.Enter;
    export var Exit = SessionService.Exit;
}