import { getWorkersByProject } from './src/lib/server/worker.actions';

async function test() {
  const res = await getWorkersByProject('any-id');
  console.log(res);
}
test();
