import { Action, ActionType, IActionPayload } from "./action";

/**
 * WIP
 */
class HistoryManager {
  private latestAction: Action | undefined;

  public addAction(
    oldData: IActionPayload,
    actionType: ActionType,
    newData: IActionPayload
  ): void {
    const newAction = new Action(
      oldData,
      actionType,
      newData,
      this.latestAction
    );

    if (this.latestAction) {
      this.latestAction.followingAction = newAction;
    }

    this.latestAction = newAction;
  }

  public getLatestAction(): Action | undefined {
    return this.latestAction;
  }
}

export * from "./action";
export { HistoryManager };
