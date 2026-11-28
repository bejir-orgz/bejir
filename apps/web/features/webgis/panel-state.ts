export type LeftPanel = "regions" | "legends" | "timeline" | "layers";

export interface PanelState {
  left: LeftPanel | null;
  overview: boolean;
}

export type PanelAction =
  | { type: "toggle-left"; panel: LeftPanel; narrow: boolean }
  | { type: "open-left"; panel: LeftPanel; narrow: boolean }
  | { type: "toggle-overview"; narrow: boolean }
  | { type: "close-all" }
  | { type: "show-overview" };

export const initialPanelState: PanelState = { left: null, overview: false };

export function panelReducer(state: PanelState, action: PanelAction): PanelState {
  if (action.type === "show-overview") return { left: null, overview: true };
  if (action.type === "close-all") return initialPanelState;
  if (action.type === "open-left") {
    return {
      left: action.panel,
      overview: action.narrow ? false : state.overview,
    };
  }
  if (action.type === "toggle-overview") {
    return { left: action.narrow ? null : state.left, overview: !state.overview };
  }
  return {
    left: state.left === action.panel ? null : action.panel,
    overview: action.narrow ? false : state.overview,
  };
}
