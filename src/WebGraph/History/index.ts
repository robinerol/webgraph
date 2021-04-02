import { Action, ActionType, IActionPayload } from "./action";

/**
 * Manages the history by holding and altering the latest not reverted action.
 * The actions themselves are a double linked list {@see {@label Action}}.
 * This class provides an easy abstracted access to this data structure.
 *
 * {@label HistoryManager}
 */
class HistoryManager {
  private latestNotRevertedAction: Action | undefined = undefined;

  /**
   * Adds a new action to the history.
   *
   * @param oldData - The data before the action {@see IActionPayload}
   * @param actionType - The action performed {@see ActionType}
   * @param newData - The data to be applied {@see IActionPayload}
   */
  public addAction(
    oldData: IActionPayload,
    actionType: ActionType,
    newData: IActionPayload
  ): void {
    const newAction = new Action(oldData, actionType, newData);

    if (
      !this.latestNotRevertedAction ||
      this.latestNotRevertedAction.isReverted
    ) {
      this.latestNotRevertedAction = newAction;
    } else {
      newAction.previousAction = this.latestNotRevertedAction;
      this.latestNotRevertedAction.followingAction = newAction;
      this.latestNotRevertedAction = newAction;
    }
  }

  /**
   * Gets the latest action that has not been reverted yet.
   *
   * @returns - An Action object if available and undefined if not
   */
  public getLatestAction(): Action | undefined {
    if (this.latestNotRevertedAction?.isReverted) return undefined;
    return this.latestNotRevertedAction;
  }

  /**
   * Gets the latest reverted action.
   *
   * @returns - An Action object if available and undefined if not
   */
  public getLatestRevertedAction(): Action | undefined {
    if (this.latestNotRevertedAction?.isReverted) {
      return this.latestNotRevertedAction;
    }

    return this.latestNotRevertedAction?.followingAction;
  }

  /**
   * Marks the latest action as reverted. To be used with an undo
   * operation.
   */
  public markLatestActionAsReverted(): void {
    if (!this.latestNotRevertedAction) return;

    this.latestNotRevertedAction.isReverted = true;

    if (!this.latestNotRevertedAction.previousAction) return;
    this.latestNotRevertedAction = this.latestNotRevertedAction.previousAction;
  }

  /**
   * Marks the latest reverted action as not reverted anymore. To be used
   * with an redo operation.
   */
  public markLatestRevertedActionAsNotReverted(): void {
    if (!this.latestNotRevertedAction) return;

    const action = this.getLatestRevertedAction();
    if (!action) return;

    action.isReverted = false;
    this.latestNotRevertedAction = action;
  }
}

export * from "./action";
export { HistoryManager };
