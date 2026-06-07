import { Router } from 'express';
import * as jungleController from '../controllers/jungle.controller.js';

const jungle = Router();

jungle.post('/', jungleController.create);
jungle.get('/:id', jungleController.get);
jungle.put('/:id', jungleController.update);
jungle.delete('/:id', jungleController.deforrest);

export default jungle;