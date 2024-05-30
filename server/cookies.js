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

function createDisplayInformationCookie(req, res){
    let DisplayInformation
    try{
        DisplayInformation = {
            theme: req.session.AccountInfo.Visuals.Theme,
            profileIcon: req.session.AccountInfo.Visuals.AccountImage,
            Earnings: req.session.AccountInfo.Earnings
        }
    }
    catch{
        return;
    }
    res.cookie("DisplayInformation", DisplayInformation);
}

//When the notification system is put in, we could add another option to change the colour of your notifications

module.exports = {
    validateSessionInfocookie,
    createDisplayInformationCookie
}
