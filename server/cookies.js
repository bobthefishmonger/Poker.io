const crypto = require("crypto");
const db = require("./dbmanager.js");
require("dotenv").config();
//Util functions
function createCookieExpiry(days) {
    var creationDate = new Date();
    var expiryDate = new Date(creationDate.getTime() + (days * 24 * 60 * 60 * 1000));
    return expiryDate;
}

function encrypt(text) {
    let iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.SessionInfo_Enkey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + "l" + encrypted.toString('hex');
}

function decrypt(text) {
    let textParts = text.split("l");
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join("l"), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.SessionInfo_Enkey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
//SessionInfo cookie
function createSessionInfoCookieData(days){
    let data  = {
        SessionID: crypto.randomUUID(),
        Expirery: createCookieExpiry(days).toISOString()
    }
    data = encrypt(JSON.stringify(data));
    return data;
}

function createSessionInfoCookie(res){
    const data = createSessionInfoCookieData(21)
    res.cookie("SessionInfo", data, {httpOnly: true, expires: createCookieExpiry(21)})
    return decrypt(data);
}

function resetSessionInfoCookie(res){
    res.clearCookie("SessionInfo");
    let data  = createSessionInfoCookie(res);
    data = JSON.parse(data);
    return data
}

async function validateSessionInfocookie(req, res){
    let SessionInfo;
    let ShouldLogIn = [false, null];
    if (req.cookies["SessionInfo"]){
        let decryptedSessionInfo;
        try{    
            decryptedSessionInfo = JSON.parse(decrypt(req.cookies["SessionInfo"]));
            const valid = await db.checkSessionInfo(decryptedSessionInfo)
            if (valid){
                const oldSessionID = decryptedSessionInfo.SessionID;
                SessionInfo = resetSessionInfoCookie(res);
                try{
                    db.updateSessionInfo(oldSessionID, SessionInfo);
                    ShouldLogIn = [true, valid]
                }
                catch{
                    console.error("DB cookie writing error");
                }
            }
            else{
                SessionInfo = resetSessionInfoCookie(res);
            }
        }
        catch(err){
            console.error("Invalid cookie format");
            SessionInfo = resetSessionInfoCookie(res);
        }
    }
    else{
       SessionInfo = createSessionInfoCookie(res);
    }
    return [SessionInfo, ShouldLogIn]
}

module.exports = {
    validateSessionInfocookie
}


//should we have a theme cookie
//const themeCookie = res.cookie("theme", themename, {})
//dont want it to be httpOnly, needs to be changed on client side, expire at the end of session 
// (should be resent) <- use middleware
// what if this cookie is expanded to be the entire of "cached" account info
// Ofc it wont be used server side, but as a way to avoid unecessary server req?
//const preferences = {
//      theme: "one of the themes",
//      profileIcon: "path/to/icon",
//      Earnings: earnings object with the three earnings at 
// }
//const preferenceCookie = res.cookie("accountpreferences", preferences)
//dont want it to be http only, but expire at  end of session^^