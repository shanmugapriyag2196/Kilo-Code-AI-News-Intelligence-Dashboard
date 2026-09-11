import nodeSchedule from 'node-schedule';
let scheduledJob = null;
export function startScheduler(config, refreshFn) {
    if (scheduledJob) {
        scheduledJob.cancel();
    }
    const intervalMinutes = Math.max(1, config.refreshIntervalMinutes);
    scheduledJob = nodeSchedule.scheduleJob(`*/${intervalMinutes} * * * *`, async () => {
        try {
            await refreshFn();
        }
        catch (err) {
            console.error('Scheduled refresh failed:', err);
        }
    });
    console.log(`Scheduler started: refresh every ${intervalMinutes} minutes`);
}
export function stopScheduler() {
    if (scheduledJob) {
        scheduledJob.cancel();
        scheduledJob = null;
        console.log('Scheduler stopped');
    }
}
//# sourceMappingURL=scheduler.js.map