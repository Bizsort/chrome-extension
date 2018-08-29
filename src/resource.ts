//GetValue: (resource, enumeration, name) => (value) => any;
export function GetValue (resource, enumeration, name) {
    var cache = {};
    var inner = (value) => {
        var cachedValue = cache[value];
        if (cachedValue == undefined) {
            for (var n in enumeration) {
                if (enumeration[n] == value) {
                    cachedValue = resource[name + '_' + n];
                    cache[value] = cachedValue;
                    return cachedValue;
                }
            }
        }
        else
            return cachedValue;
    };
    return inner;
};

export const Action = {
    Cancel: "Cancel",
    Change: "Change",
    Ok: "Okay",
    Post: "Post",
    Remove: "Remove",
    Save: "Save",
    Search: "Search",
    Send: "Send",
    Sign_in: "Sign In"
};

export const Business = {
    Confirm_Delete_Multiproduct: "Do you want to delete company's What We Do page?",
    Profile: "Company Profile",
    Uncategorized: "Uncategorized Companies"
};

export const Community = {
    Category_Topic_All: "All Category Topics",
    Confirm_Delete: "Do you want to delete {0} community?",
    Member: "Member",
    Topic: "Topic"
};

export const Dictionary = {
    All_Categories: "All Categories",
    Business_directory: "Business directory",
    Blog: "Blog",
    Category: "Category",
    City: "City",
    company: "company",
    community: "community",
    Confirm_email: "Confirm email",
    Country: "Country",
    Directory: "Directory",
    Email: "Email",
    Error: "Error",
    Error_details: "Error details",
    Everywere: "Everywere",
    Location: "Location",
    Main: "Main",
    Name: "Name",
    Password: "Password",
    Postal_code: "Postal code",
    Phone: "Phone",
    Products_and_Services: "Products and Services",
    Product_directory: "Product directory",
    product: "product",
    record: "record",
    Remember_me: "Remember me",
    Search_criteria: "Search criteria",
    Security_code: "Security code",
    service: "service",
    Service_directory: "Service directory",
    Street_address: "Street address",
    Topic: "Topic",
    Unlisted: "Unlisted",
    What: "What",
    Where: "Where"
};

export const Exception = {
    Operation_Invalid: "Operation is not allowed",
    Operation_InvalidInput: "Invalid or missing input parameter(s) for this operation",
    Operation_InvalidInteraction: "Actor or Addressee for this interaction is missing or invalid",
    Operation_UnexpectedState: "Operation is not valid for this state of object",
    Operation_NotSupported: "Operation is not supported",
    Operation_InternalError: "Internal server has error occured",
    Data_RecordNotFound: "Record could not be found",
    Data_DuplicateRecord: "Record already exists",
    Data_ReferentialIntegrity: "Record could not be deleted due to referential integrity constraints",
    Data_StaleRecord: "Your version of the record is not current, please refresh and try again",
    Session_Unavailable: "Server is unavailable",
    Session_NotAuthenticated: "This operation requires authentication, please sign-in",
    Session_Unauthorized: "You are not authorized to perform this operation",
    Session_QuotaExceeded: "Maximum allowed quota has been reached for you account",
    Argument_Invalid: "Invalid value for {0}",
    Argument_ValueRequired: "Value required for {0}",
    Unknown: "An unknown error was encountered, please contact technical support for more information"
};

export const Global = {
    Account_Email_Error_Duplicate: "Account with email {0} already exists in our system.",
    Account_Email_Error_NotFound: "Email could not be found.",
    Account_Password_Requirement: "Password must be at least 6 characters long, contain both lower and upper letters and at least one number or special character.",
    Account_Password_Weak: "Password is too weak",
    Account_UserName_Invalid: "Name may contain letters and space(s) only",
    Bizsort: "Bizsort",
    Are_you_sure: "Are you sure?",
    Category_All: "All Categories",
    Confirm_Delete_X: "Do you want to delete {0}?",
    Country_Error_NotSupported: "{0} is not supported",
    Folder_Error_Delete: "{0} could not be deleted! If it has {1}, delete them first",
    Folder_Error_Name_Exists: "{0} with this name exists already",
    Editor_Error_Enter_X: "Please enter {0}",
    Editor_Error_Enter_X_Name: "Please enter {0} name",
    Editor_Error_Enter_X_Valid: "Please enter valid {0}",
    Editor_Error_processing_request_X: "There was an error processing your request. {0}",
    Editor_Error_Select_X: "Please select {0}",
    Editor_Error_Select_X_From_List: "Please select {0} from list",
    Editor_Error_Value_X_Not_Valid: "Value {0} does not satisfy validation criteria",
    List_Header_EmptyFormat: "There are curently no {0} to display",
    List_Header_Format: "Showing {0} - {1} of {2} {3}",
    Location_Error_X: "Please enter location including {0}",
    Page_TitleSeparator: " | ",
    Search_Header_EmptyFormat: "Your search for {1} did not return any results",
    Search_Header_Format: "Showing {0} - {1} of {2} {3} for {4}",
    SignIn_Error_AccountInactive: "Account is not active",
    SignIn_Error_AccountLocked: "Account is locked please reset your password",
    SignIn_Error_InvalidEmailPassword: "Invalid email or password",
    X_Ads: "{0} Ads"
};

export const Product = {
    Status_Draft: "Draft",
    Status_Pending: "Pending",
    Status_Active: "Active",
    Status_Rejected: "Rejected",
    Status_Archived: "Archived",
    Status_Deleted: "Deleted",
    Uncategorized: "Uncategorized Products"
};


//TODO: *.html import
window['Resource'] = {
    'Action': Action,
    'Business': Business,
    'Community': Community,
    'Dictionary': Dictionary,
    'Exception': Exception,
    'Global': Global,
    'Product': Product
};