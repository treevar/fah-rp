const ax = require("axios");
const localApi = "http://127.0.0.1:7396/api";
const fahApi = "https://api.foldingathome.org";
const statsApi = "https://stats.foldingathome.org";

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
        this.project = {id:Number, cause:String};
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
        this.id = Number;
    }
}

let user = new User;

let logging = true;
//module.exports.logging = logging;

function log(d){ 
    if(logging){ console.log(d); } 
}
module.exports.log = log;

function handleErr(err, fatal){
    console.log(err);
    if(fatal){ 
        console.log("Verify Folding@home is running\nTerminating Program");
        process.exit(1); 
    }
} 

async function getSid(){
    return await ax.put(localApi + "/session", {
        params:{
            _: Math.random()
        }
    }).then((res) => {
        let sid = res.data;
        log("Got SID: " + sid);
        return sid;
    }).catch((err) => handleErr("getSid(): " + err, 1));
}

async function getBasicUserData(){
    await ax.get(localApi + "/basic", {
        params:{
            sid: user.sid
        }
    }).then((res) => {
        user.name = res.data.user;
        user.team.id = res.data.team;
        user.passkey = res.data.passkey;
        user.ver = res.data.version;
    }).catch((err) => handleErr("getBasicUserData(): " + err, 1));
}

async function updateUserInfo(){
    /*await ax.get(fahApi + "/user/" + user.name).then((res) => {
        user.id = res.data.id;
        user.points = res.data.score;
        for(team in res.data.teams){
            if(team.team != user.team.id){ continue; }
            user.contributed = team.score;
            user.team.name = team.name;
            break;
        }
    }).catch((err) => handleErr(err));*/
    await ax.get(statsApi + "/user", {
        params:{
            callback: 0,
            user: user.name,
            team: user.team.id,
            passkey: user.passkey
        }
    }).then((res) => {
        //console.log(res.data.toString());
        let data = res.data.toString();
        data = JSON.parse(data.substring(3, data.length-2))[1];
        user.contributed = data.contributed;
        user.points = data.earned;
        user.team.name = data.team_name;
        user.team.points = data.team_total;
        user.team.rank = data.team_rank;
        log("Updated User Info");
    }).catch((err) => handleErr("updateUserInfo(): " + err, 1));
}

async function updateSlots(){
    user.slots = [];
    await ax.get(localApi + "/slots", {
        params: {
            sid: user.sid
        }
    }).then((res) => {
        let data = res.data;
        //console.log(data);
        for(let i = 0; i < data.length; i++){
            let s = data[i];
            let c = s.description[0] == 'c' ? Number(s.description.split(':')[1]) : 1;
            //log(s.project);
            let pid = s.project;
            if(pid == undefined){ pid = 0; }
            user.slots.push({count: c, percent: s.percentdone, project: {id: pid, cause: ""}, state: s.status, type: s.description.substring(0, 3).toUpperCase()});
        }
    }).catch((err) => handleErr("updateSlots(): " + err, 1));
    for(let i = 0; i < user.slots.length; i++){
        let s = user.slots[i];
        //404s if project is zero
        if(s.project.id != 0){
            await ax.get(fahApi + "/project/" + s.project.id).then((res) => {
                s.project.cause = res.data.cause;
            }).catch((err) => {
                handleErr("updateSlots(): (Project -> " + s.project.id + ") " + err, 0);
                s.project.cause = "unspecified";
            });
        }
        else{
            s.project.cause = "unspecified";
        }
        log("Updated Slot " + i);
    }
}

async function init(){
    user.sid = await getSid();
    await getBasicUserData();
    await updateUserInfo();
    await updateSlots();
    //console.log(user.slots[1].project.cause);
}
module.exports.init = init;

//prevents user from setting logging to anything but a boolean
function setLogging(l){ logging = (l==true); }
module.exports.setLogging = setLogging;

function getLogging(){ return logging; }
module.exports.getLogging = getLogging;

async function updateUser(){
    await updateUserInfo();
    return await updateSlots().then(()=>{return user;});
}
module.exports.updateUser = updateUser;

function getUser(){ return user; }
module.exports.getUser = getUser;

function getSlot(type){
    return new Promise((resolve, reject) =>{
        user.slots.forEach((s) =>{
            if(s.type == type){ resolve(s); }
        });
        resolve(undefined);
    });
}
module.exports.getSlot = getSlot;