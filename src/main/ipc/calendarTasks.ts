import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import type { CalendarTaskInput } from '../../shared/calendarTasks';
import * as calendarTasks from '../db/calendarTasks';

export function registerCalendarTasksIpc(): void {
  ipcMain.handle(IpcChannels.calendarTasksListForDate, (_event, taskDate: string) =>
    calendarTasks.listCalendarTasksForDate(taskDate),
  );

  ipcMain.handle(
    IpcChannels.calendarTasksListInRange,
    (_event, fromDate: string, toDate: string) =>
      calendarTasks.listCalendarTasksInRange(fromDate, toDate),
  );

  ipcMain.handle(IpcChannels.calendarTasksCreate, (_event, input: CalendarTaskInput) =>
    calendarTasks.createCalendarTask(input),
  );

  ipcMain.handle(
    IpcChannels.calendarTasksUpdate,
    (_event, id: string, input: CalendarTaskInput) =>
      calendarTasks.updateCalendarTask(id, input),
  );

  ipcMain.handle(IpcChannels.calendarTasksDelete, (_event, id: string) =>
    calendarTasks.deleteCalendarTask(id),
  );
}
