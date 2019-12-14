import { parse } from 'fast-html-parser';
import { AllHtmlEntities } from 'html-entities';
const allEntities = new AllHtmlEntities();

export interface IJsonScheduleGlobal {
  cat: string;
  classNo: string;
  weeks: IJsonScheduleWeek[],
}

export interface IJsonScheduleWeek {
  obj: Date;
  day: number;
  month: number;
  year: number;
  lessons: IJsonScheduleLesson[],
}

export interface IJsonScheduleLesson {
  
}

function createScheduleWeek(dateString: string): IJsonScheduleWeek {
  const [full, sday, smonth, syear] = dateString.trim().match(/([\d]{2})\.([\d]{2})\.([\d]{4})$/);
  const day = parseInt(sday);
  const month = parseInt(smonth) - 1; // months start at 0
  const year = parseInt(syear);
  return {
    obj: new Date(year, month, day),
    day,
    month,
    year,
    lessons: [],
  };
}

function createScheduleLesson(nodes: any): IJsonScheduleLesson {
  let timeInfo = allEntities.decode(nodes[0].rawText.trim());
  const classInfo = nodes[3];

    // remove non breaking spaces
    timeInfo = timeInfo
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, '    ')
      .replace(/\u00a0/g, ' ')
      .replace(/\u2424/g, '\n');

    const [full, sday, start, end, location] = timeInfo.match(/^([a-zA-Z]{2}\/[a-zA-Z]{2})[\s]*([\d]{2}\sh\s[\d]{2})[\s]*-[\s]*([\d]{2}\sh\s[\d]{2})[\s]*-[\s]*(.+)$/);


  console.log('timeInfo', timeInfo);
  console.log(' ');
      // console.log('node 3', node.childNodes[3]);
      // console.log(' ');
  return {
    timeInfo,
    classInfo,
  }
}

export function jsonParser(htmlContent: string): IJsonScheduleGlobal {
  const parseContent = parse(htmlContent, {
    script: false, 
    style: false, 
    pre: false,
  });

  const bodyContent = parseContent.childNodes[0].childNodes[3];
  // make sure the body is at the right place
  if (bodyContent.tagName !== 'body') {
    throw new Error('Source file has changed. Cannot generate ICAL');
  }
  const mainDiVcontent = bodyContent.childNodes[1].childNodes[5].childNodes[1];
  // make sure the main div is at the right place
  if (mainDiVcontent.tagName !== 'div') {
    throw new Error('Source file has changed. Cannot generate ICAL');
  }

  const sortedData: IJsonScheduleGlobal = {
    cat: '',
    classNo: '',
    weeks: [],
  };
  let currentWeek: IJsonScheduleWeek;
  // go through the content and sort it
  mainDiVcontent.childNodes.forEach(node => {
    if (node.tagName === 'h5') { // class info
      const tmp = node.childNodes[0].rawText.trim().split('-');
      sortedData.cat = tmp[0].trim();
      sortedData.classNo = tmp[1].trim();
    }
    if (node.tagName === 'p') { // week and class info
      const tmp1 = node.childNodes[0];
      const tmp2 = node.childNodes[3];
      // detect if this is a new week
      if (tmp2 === undefined && tmp1.tagName !== 'a') {
        if (currentWeek !== undefined){
          sortedData.weeks.push(currentWeek);
        }
        currentWeek = createScheduleWeek(tmp1.rawText);
      } else {
        if (currentWeek !== undefined){
          currentWeek.lessons.push(createScheduleLesson(node.childNodes));
        }
      }
    }
  });
  return sortedData;
}