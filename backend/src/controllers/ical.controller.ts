import * as express from 'express'
import { Request, Response } from 'express'
import IControllerBase from '../interfaces/IControllerBase.interface'
import { get } from 'request-promise';
import { jsonParser, IJsonScheduleGlobal } from '../lib/HesScheduleParser';
import * as ical from 'ical-generator';

const basePlanningUrl: string = 'http://mobileapps.hevs.ch/HoraireBellevue/Planning.aspx?NoClasse=';
class HomeController implements IControllerBase {
  public router: express.Router = express.Router();

  constructor() {
    this.initRoutes()
  }

  public initRoutes() {
    this.router.get('/v1/ical', this.index)
  }

  index = async (req: Request, res: Response) => {
    const classNo: number = 208; // TODO: use value from query

    const htmlContent = await get(`${basePlanningUrl}${classNo}`);

    const sortedData: IJsonScheduleGlobal = jsonParser(htmlContent);
    const cal = ical({domain: 'hevs.ch', name: `${sortedData.cat} - ${sortedData.classNo}`});
    
    sortedData.weeks.forEach(week => {
      week.lessons.forEach(lesson => {
        cal.createEvent({
          start: lesson.start,
          end: lesson.end,
          summary: lesson.course,
          description: `Teacher: ${lesson.teacher}`,
          location: lesson.location,
        });
      })
    })

    cal.serve(res);
  }
}

export default HomeController