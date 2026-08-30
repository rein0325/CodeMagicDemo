import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { EditorState } from "@codemirror/state";

export class SpellEditor {
  private view: EditorView;

  constructor(mountEl: HTMLElement, initialCode: string) {
    this.view = new EditorView({
      state: EditorState.create({ doc: initialCode, extensions: [basicSetup, python()] }),
      parent: mountEl,
    });
  }

  getCode(): string {
    return this.view.state.doc.toString();
  }

  setCode(code: string): void {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: code },
    });
  }
}
