const petitionNum = 114822;
const axios = require('axios');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
let numbersInPagin = [];
let myIter = 1;
let start = 0;
let finish = 0;
let duration;
let timeNow;



// fetch petition page in JSON format
fetch('https://petition.president.gov.ua/petition/'+ petitionNum + '/votes/1/json')
  .then(res => res.json()) // the .json() method parses the JSON response into a JS object literal
  //get pagination HTML from response
  .then(data => data.pag_html)
  .then(pagination =>  {
      //files that will be removed on start 
      const filesToRemove = ['data.txt', 'error.txt', 'error.json'];
      fileRemover(filesToRemove);
      
    // console.log(pagination);
    //find all numbers, push it to array and take max to find out hove many pages with names 
    let r = /\d+/g;
    let m;
    while ((m = r.exec(pagination)) != null) {
        numbersInPagin.push(m[0]);
    }
    
    if(numbersInPagin.length > 0){
        parse(Math.max(...numbersInPagin));
    }else{
        parse(1);
    }
  });

  //convert MS to hh:mm:ss.ms format
  function msToTime(duration) {
    let milliseconds = Math.floor((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
  }
//removing unwanted files in root dir
function fileRemover(files){
    for(let i=0; i<files.length; i++){
        if (fs.existsSync('./' + files[i])) {
            fs.unlinkSync('./' + files[i]);
          }
    }
    
}

const parse = async (pageNum) => {
    const getHTML = async (url) => {
        const { data } = await axios.get(url);
        return cheerio.load(data);
    }
    const getNames = async() => {
        try{
            for (let i = myIter; i <= pageNum; i++){
                //set iteration start time
                start = Date.now(); 
                // throw ( new Error('The message of error') );
                const $ = await getHTML("https://petition.president.gov.ua/petition/" + petitionNum + "/votes/" + i +"/");
                // console.log($.html());
                $('.table_row').each((i, element) => {
                    const num = $(element).find('div.number').text();
                    const name = $(element).find('div.name').text();
                    const date = $(element).find('div.date').text();
                    const numAndDate = `${num} ${name}`;
                    let spaces = '';
        
                    for (let i=0; i<60-numAndDate.length; i++){
                        spaces += ".";
                    }
                    fs.appendFileSync('./data.txt', `${numAndDate} ${spaces} ${date} \n`);
                })
                myIter = i+1;

                //set iteration ent time
                finish = Date.now(); 
                console.log(msToTime(finish-start))
                console.log(`page ${i} completed \n`);
            }
            clearInterval(duration);
            console.log(`all completed`);
        }
        catch(e){
            console.log('some error occurred') // handle error
            fs.writeFileSync('./error.json', JSON.stringify(e, null, 2) , {encoding: 'utf-8', flag: 'a+'});
            fs.appendFileSync('./error.txt', e.message + '\n');
            setTimeout(()=>{getNames()}, 1000);
        }
    }
    //sometimes there is no promise response from await(mostly in busy time, when people are active and signing petisions the most). 
    //so if it is happens and page parsing (one iteration) taking to long try again starting last known iteration. 
    //not the best solution as previous loop still running. but as long as there is normally would be max one or two such errors -
    //it is works fine. 
    //you can disable this solution by commenting - durationChecker();
    let durationChecker = () => {
        duration = setInterval(() => {
            timeNow = Date.now();
            if(timeNow>start+60000){
                console.log('\n current iteration taking too long \n trying to restart\n')
                getNames();
            }
        }, 60000);
    }
    durationChecker();
    getNames();
} 






  





