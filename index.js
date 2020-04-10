const rp = require("discord-rich-presence")("688506585240436821");
const f = require("./fah-stats.js");
const config = require("./config.json");

function getSlotProj(slot){
    return new Promise((resolve, reject) =>{
        if(slot == undefined){
            resolve("Folding@Home");
        }
        //if(slot.state == "PAUSED"){ resolve("Paused"); }
        else if(slot.project.type == "unspecified"){
            if(slot.project.id == 0){
                resolve("Waiting for WU");
            }
            else{
                resolve("Project " + slot.project.id);
            }
        }
        else{ resolve(slot.project.type[0].toUpperCase() + slot.project.type.slice(1)); }
    });
}

async function getSlotText(slot){
    let str = await getSlotProj(slot);
    return new Promise((resolve, reject) => {
        if(slot == undefined){ resolve(str); }
        else{ resolve(slot.type + "(" + slot.count + "): " + (slot.state == "PAUSED" ? "Paused" : slot.percent) + " - " + str); }
    }); 
}

function getSlotKey(slot){
    return new Promise((resolve, reject) =>{
        if(slot == undefined){ resolve("logo"); }
        else{ resolve(slot.project.type); }
    });
}

let mode = 0;
let modes = [];
let doCycle = false;
let cycles = 5;

let primary = {user:"GPU", auto:false, slot:Object};

let count = 0;
function cycleMode(){
    return new Promise((resolve, reject) =>{
        if(++count == cycles){
            count = 0;
            if(++mode == modes.length){
                mode = 0;
            }
        }
        resolve(modes[mode]);
    });
}

async function getMode(){
    if(doCycle){
        return await cycleMode();
    }
    else{
        return mode;
    }
}

function strToMode(str){
    switch(str){
        case "name":
            return 0;
        case "team":
            return 1;
        case "slots":
            return 2;
    }
}

let main = async() =>{
    await f.init();
    while(true){
        let user = await f.updateGetUser();
        let secSlot;
        if(primary.user == "CPU"){
            primary.slot = await f.getSlot("CPU");
            secSlot = await f.getSlot("GPU");
        }
        else{
            primary.slot = await f.getSlot("GPU");
            secSlot = await f.getSlot("CPU"); 
        }
        //In the event there is only one slot
        if(primary.slot == undefined){
            if(secSlot){
              primary.slot = secSlot;
              primary.auto = false;
              secSlot = undefined;
            }
        }
        if(primary.auto){
            if(primary.slot.project.id == 0 || primary.slot.state == "PAUSED"){
                let tmp = primary.slot;
                primary.slot = secSlot;
                secSlot = tmp;
            }
        }
        let lkey = await getSlotKey(primary.slot);
        let ltext = await getSlotText(primary.slot);
        let skey;
        let stext;
        if(secSlot){
          skey = await getSlotKey(secSlot);
          stext = await getSlotText(secSlot);
        }
        else{
          skey = "none";
          stext = "none";
        }
        switch(await getMode()){
            case 0:
                rp.updatePresence({
                    details: user.name,
                    state:  user.points + " Points",
                    largeImageKey: lkey,
                    largeImageText: ltext,
                    smallImageKey: skey,
                    smallImageText: stext,
                    instance: true
                });
                break;
            case 1:
                rp.updatePresence({
                    details: user.team.name,
                    state: user.contributed + " Points",
                    largeImageKey: lkey,
                    largeImageText: ltext,
                    smallImageKey: skey,
                    smallImageText: stext,
                    instance: true
                });
                break;
            case 2:
                rp.updatePresence({
                    details: primary.slot ? primary.slot.type + " Folding: " + await getSlotProj(primary.slot) : "  ",
                    state: secSlot ? secSlot.type + " Folding: " + await getSlotProj(secSlot) : "  ",
                    largeImageKey: lkey,
                    largeImageText: ltext,
                    smallImageKey: skey,
                    smallImageText: stext,
                    instance: true
                });
                break;                
        }
    }
}
//Load from config file
mode = strToMode(config.mode);
doCycle = config.doCycle;
cycles = config.cycles;
config.cycleModes.forEach((m) =>{
    let mode = strToMode(m);
    if(mode != undefined){
        modes.push(mode);
    }
});
primary.user = config.primary;
primary.auto = config.autoPrimary;
f.setLogging(config.logging);

console.log("mode: " + mode);
console.log("doCycle: " + doCycle);
console.log("cycles: " + cycles);
console.log("modes: " + modes);
console.log("logging: " + f.logging);
console.log(primary);

//Command line args
/*let args = process.argv.slice(2); 
if(args){
    args.forEach((a) =>{
        if(a.startsWith("mode=")){
            mode = strToMode(a.substr(5));
        }
        else if(a.startsWith("cycle=")){
            let mode = a.substr(6).split(',');
            if(mode){
                if(parseInt(mode[0]) != NaN){
                    cycles = parseInt(mode[0]);
                    doCycle = true;
                    mode.forEach((m) =>{
                        modes.push(strToMode(m));
                    });
                }
            }
        }
        else if(a.startsWith("primary=")){
            let str = a.substr(8);
            if(str == "GPU" || str == "CPU"){ primary.user = str; }
        }
        else if(a.startsWith("autoPrimary")){
            primary.auto = true;
        }
    });
}*/
main();
