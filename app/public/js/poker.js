async function createRoom(event){
    event.preventDefault();
    let data = {
        "visibility": document.getElementById("visibility").value,
        "maxplayers": document.getElementById("nplayers").value,
        "stacksize": document.getElementById("stacksize").value
    }
    data = JSON.stringify(data);
    let response = await fetch("/games/poker/createroom",{
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: data
    });
    response = await response.json()
    if (response.success){
        document.querySelector("body").innerHTML = response.message;
    }else{
        document.getElementById("errormsg").innerHTML = response.errormessage;
    }
}

document.getElementById("createroombtn").onclick = async (event)=>{
    await createRoom(event);
}


window.onload = ()=>{
    setCSStheme("poker");
}