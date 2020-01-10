import { parse } from 'fast-html-parser';
import { AllHtmlEntities } from 'html-entities';
import * as moment from 'moment';
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
  start: Date;
  end: Date;
  location: string;
  teacher: string;
  course: string;
}

function createScheduleWeek(dateString: string): IJsonScheduleWeek {
  const [full, sday, smonth, syear] = dateString.trim().match(/([\d]{2})\.([\d]{2})\.([\d]{4})$/);
  const day = parseInt(sday);
  const month = parseInt(smonth) - 1; // months start at 0
  const year = parseInt(syear);
  return {
    obj: moment(`${sday}-${smonth}-${syear}`, 'DD-MM-YYYY').toDate(),
    day,
    month,
    year,
    lessons: [],
  };
}

function getDayFromString(dayString: string): number {
  switch(dayString) {
    case 'Lu/Mo':
      return 0;
    case 'Ma/Di':
      return 1;
    case 'Me/Mi':
      return 2;
    case 'Je/Do':
      return 3;
    case 'Ve/Fr':
      return 4;
    case 'Sa/Sa':
      return 5;
    default:
      return 6;
  }
}

function formatTime(timeString: string): string {
  return timeString.replace(' h ', ':');
}

function createScheduleLesson(week: Date, nodes: any): IJsonScheduleLesson {
  let timeInfo = allEntities.decode(nodes[0].rawText.trim());
  const [teacher, cat, classNo, course] = nodes[3].childNodes[0].rawText.split(' - ');

  // remove non breaking spaces
  timeInfo = timeInfo
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  const [full, sday, start, end, location] = timeInfo.match(/^([a-zA-Z]{2}\/[a-zA-Z]{2})[\s]*([\d]{2}\sh\s[\d]{2})[\s]*-[\s]*([\d]{2}\sh\s[\d]{2})[\s]*-[\s]*(.+)$/);

  const startTime = moment(week).add(getDayFromString(sday), 'day');
  const endTime = startTime.clone();
  const hourStartTime = moment(formatTime(start), 'HH:mm');
  const hourEndTime = moment(formatTime(end), 'HH:mm');

  startTime.set({
    hour: hourStartTime.get('hour'),
    minute: hourStartTime.get('minute'),
    second: hourStartTime.get('second')
  });
  endTime.set({
    hour: hourEndTime.get('hour'),
    minute: hourEndTime.get('minute'),
    second: hourEndTime.get('second')
  });

  return {
    start: startTime.toDate(),
    end: endTime.toDate(),
    location,
    teacher: teacher.trim(),
    course: course.trim(),
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
          currentWeek.lessons.push(createScheduleLesson(currentWeek.obj, node.childNodes));
        }
      }
    }
  });
  return sortedData;
}