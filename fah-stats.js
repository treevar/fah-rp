const ax = require("axios")
const apiURL = "http://127.0.0.1:7396/api";
const projects = require("./projects.json");

class Team{
    constructor(){
        this.id = Number;
        this.points = Number;
        this.name = String;
        this.rank = Number;
    }
}

class Slot{
    constructor(){
        this.count = Number;
        this.percent = String;
        this.project = {"id":Number, "type":String};
        this.state = String;
        this.type = String;
    }
}

class User{
    constructor(){
        this.name = String;
        this.sid = String;
        this.passkey = String;
        this.points = Number;
        this.contributed = Number;
        this.team = new Team;
        this.slots = [];
        this.ver = String
    }
}


//true: CPU main, false: GPU main 
//TODO: make into own class/module
//TODO: 3 options for display stats
/*  Name 
    total points
    --
    team name
    team points
    --
    Main proj
    sec proj
*/

let user = new User;

let logging = false;
module.exports.logging = logging;

function log(d){ 
    if(logging){ console.log(d); } 
}

function handleErr(err){
    console.log(err + "\nVerify Folding@home is running\nTerminating Program");
    process.exit(1);
}

function getProject(id){
    for(let i = 0; i < projects.length; i++){
        if(projects[i].id == id){ return projects[i]; }
    }
}

async function getSid(){
    return await ax.get("http://127.0.0.1:7396/js/main.js").then((res)=>{
        let sid = res.data.substring(7, 39);
        console.log("Got SID: " + sid);
        return sid;
    }).catch((err) => handleErr(err));
}

async function getUserInfo(){
    return await ax.get(apiURL + "/basic", {
        params: {
            sid: user.sid
        }
    }).then(async(res) =>{
        if(JSON.stringify(res.data) == "[[\"reload\"]]"){
            log("Bad Session ID\nAttempting to get sid...");
            await getUserInfo(await getSid());
        }
        else{
            user.name = res.data.user;
            user.ver = res.data.version;
            user.passkey = res.data.passkey;
            user.team.id = res.data.team.toString();
            console.log("Got User: " + user.name + "\nGot Team: " + user.team.id + "\nGot Version: " + user.ver);
        }
    }).catch((err) => handleErr(err));
}

async function updateSlots(trys = 0){
    await ax.get(apiURL + "/slots", {
        cache: false,
        params: {
            sid: user.sid
        }
    }).then((res) => {
        if(JSON.stringify(res.data) == "[[\"reload\"]]"){
            if(trys > 2){ handleErr("Bad Session ID"); }
            log("Bad Session ID\nAttempting to get sid...");
            getSid();
            slots = updateSlots(++trys);
            return;
        }   
        var slots = [];
        res.data.forEach((s) => {
            let slot = new Slot;
            if(s.description.startsWith("cpu")){
                slot.type = "CPU";
                slot.count = parseInt(s.description.substring(4));
            }
            else{
                slot.count = 1;
                slot.type = "GPU";
            }
            slot.state = s.status;
            if(s.reason != "finished"){
                slot.percent = s.percentdone;
                slot.project = getProject(s.project);
            }
            log("Got Slot: " + slot.type + "(" + slot.count + "): " + slot.percent + " - " + "{id:" + slot.project.id + ", type:" + slot.project.type + "}");
            slots.push(slot);
        });
        user.slots = slots;
    }).catch((err) => handleErr(err));
}

async function updateStats(){
    await ax.get("https://apps.foldingathome.org/stats.py", {
        params:{
            user: user.name,
            team: user.team.id,
            passkey: user.passkey,//Not needed, but official app sends passkey
            version: user.ver,//Get current version when we get the basic info
            callback: 0//Doesn't matter what it is but it has to have a value
        }
    }).then((res) => {
        var data = JSON.parse(res.data.substring(3, res.data.length-2))[1];
        user.points = data.earned;
        user.contributed = data.contributed;
        user.team.rank = data.team_rank;
        user.team.points = data.team_total;
        user.team.name = data.team_name;
        log("Updated stats");
    }).catch((err) => {
        console.log(err);
    });
}

function getSlots(){
    return user.slots;
}
module.exports.getSlots

function getUser(){
    return user;
}
module.exports.getUser = getUser;

async function update(){
    await updateSlots();
    await updateStats();
}
module.exports.update = update;

async function updateGetUser(){
    return await update().then(()=>{ return user; })
}
module.exports.updateGetUser = updateGetUser;

async function init(){
    user.sid = await getSid();
    await getUserInfo(user);
}
module.exports.init = init;

function getSlot(id){
    return new Promise((resolve, reject) =>{
        user.slots.forEach((s) =>{
            if(s.type == id){ resolve(s); }
        });
        resolve(undefined);
    });
}
module.exports.getSlot = getSlot;