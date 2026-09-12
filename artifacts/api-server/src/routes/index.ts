import { Router, type IRouter } from "express";
import healthRouter from "./health";
import microgravityRouter from "./microgravity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(microgravityRouter);

export default router;
