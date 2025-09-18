import express, { Request, Response } from 'express';
import path from 'path';
import { main } from './generatePlan';

const app = express();
const PORT = 3000;

app.get('/', (req: Request, res: Response) => {
  main();
  res.sendFile(path.join(__dirname, 'plan.html'));
});

app.get('/plan.json', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'plan.json'));
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Report is generated at http://localhost:${PORT}`);
});