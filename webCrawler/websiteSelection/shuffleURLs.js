import {createWriteStream} from 'fs';
import { TXTtoArray } from './websiteSelection.js';

// shuffle code from: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
async function shuffle(array) {
    let currentIndex = array.length;
    let randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // Swap
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }


async function randomiseURLs(path){
    /* This function breaks down the input into three thirds.
        The values within each thirds are shuffled.
        They are then put back into one list, with a value from the first third,
        second third and third third being added in order (and so on).
      
        This outputs a txt file with one URL on each line. */
  
      let myURLs = await TXTtoArray(path);
          
      let firstThousand = myURLs.slice(0, 1000);

      let rest = myURLs.slice(1000);
      let thirdLength = rest.length / 3;

      let firstThird = rest.slice(0, thirdLength);
      let secondThird = rest.slice(thirdLength, thirdLength * 2);
      let thirdThird = rest.slice(thirdLength * 2);
  
      firstThird = await shuffle(firstThird);
      secondThird = await shuffle(secondThird);
      thirdThird = await shuffle(thirdThird);
  
      var file = createWriteStream('webCrawler/shuffled.txt');
  
      file.on('error', function(err) { console.log(err); return; });
      for(let i = 0; i < 1000; i++){
        file.write(firstThousand[i] + '\n');
      }

      for(let i = 0; i < thirdLength; i++){
        file.write(firstThird[i] + '\n');
        file.write(secondThird[i] + '\n');
        file.write(thirdThird[i] + '\n');
      }
      file.end();
  }
  
  randomiseURLs("./webCrawler/top-100k.csv");