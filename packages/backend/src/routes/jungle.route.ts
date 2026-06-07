import { Router } from 'express';
import * as jungleController from '../controllers/jungle.controller.js';

const jungle = Router();

jungle.post('/', jungleController.create);
jungle.get('/getById/:id', jungleController.getById);
jungle.get('/getByUrl/:url', jungleController.getByUrl);
jungle.put('/update/:id', jungleController.update);
jungle.delete('/deforrest/:id', jungleController.deforrest);

export default jungle;