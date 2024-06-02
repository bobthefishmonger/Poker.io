async function addprofileicon(){
    let data = new FormData();
    data.append("file", document.getElementById("profilepicinput").files[0]);
    let response = await fetch("/account/uploadimage", {
        method: "POST",
        body: data
    });
    response = await response.json();
    if (response.success){
        document.getElementById("successmessage").innerHTML = "Successfully uploaded";
        document.getElementById("profileicon").setAttribute("src", `../../uploads/profileimage/${getDisplayInformation().profileIcon}`);
    }else{
        document.getElementById("successmessage").innerHTML = "An error occured, please retry";
        document.getElementById("successmessage").classList.add("Errors");      
    }
}

async function updatetheme(){
    let response = await fetch("/account/updatetheme", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ theme: document.getElementById("themechoices").value })
    });
    response = await response.json()
    if (response.success){
        document.getElementById("successmessage").innerHTML = "Successfully uploaded";
        document.getElementById("profileicon").setAttribute("src", `../../uploads/profileimage/${getDisplayInformation().profileIcon}`);
    }else{
        document.getElementById("successmessage").innerHTML = "An error occured, please retry";
        document.getElementById("successmessage").classList.add("Errors");      
    }}

document.getElementById("themesubmitbtn").onclick = async() => {
    await updatetheme();
    setCSStheme("accounts");
}

document.getElementById("iconsubmitbtn").onclick = async() => {
    await addprofileicon();
}

window.onload = () => {
    document.getElementById("profileicon").setAttribute("src", `../../uploads/profileimage/${getDisplayInformation().profileIcon}`);
    setCSStheme("accounts");
}