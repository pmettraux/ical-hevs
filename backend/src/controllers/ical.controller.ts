import * as express from 'express'
import { Request, Response } from 'express'
import IControllerBase from '../interfaces/IControllerBase.interface'
import { get } from 'request-promise';
import { jsonParser, IJsonScheduleGlobal } from '../lib/HesScheduleParser';

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

    res.json({ sortedData: jsonParser(htmlContent) })
  }
}

export default HomeController