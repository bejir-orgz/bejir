export type LeftPanel = "regions" | "layers" | "legends" | "timeline";

export interface PanelState {
  left: LeftPanel | null;
  overview: boolean;
}

export type PanelAction =
  | { type: "toggle-left"; panel: LeftPanel; narrow: boolean }
  | { type: "toggle-overview"; narrow: boolean }
  | { type: "close-all" };

export const initialPanelState: PanelState = { left: null, overview: false };

export function panelReducer(state: PanelState, action: PanelAction): PanelState {
  if (action.type === "close-all") return initialPanelState;
  if (action.type === "toggle-overview") {
    return { left: action.narrow ? null : state.left, overview: !state.overview };
  }
  return {
    left: state.left === action.panel ? null : action.panel,
    overview: action.narrow ? false : state.overview,
  };
}
