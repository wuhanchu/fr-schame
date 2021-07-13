import {
    isMind,
    getSelectedNodes,
    getSelectedEdges
} from "@/outter/gg-editor/utils"
import {
    ItemState,
    LabelState,
    EditorEvent
} from "@/outter/gg-editor/common/constants"
import { Command } from "@/outter/gg-editor/common/interfaces"
import commandManager from "@/outter/gg-editor/common/commandManager"

export interface BaseCommand<P = object, G = G6.Graph> extends Command<P, G> {
    /** 判断是否脑图 */
    isMind(graph: G): boolean
    /** 获取选中节点 */
    getSelectedNodes(graph: G): G6.Node[]
    /** 获取选中连线 */
    getSelectedEdges(graph: G): G6.Edge[]
    /** 设置选中节点 */
    setSelectedNode(graph: G, id: string): void
    /** 编辑选中节点 */
    editSelectedNode(graph: G): void
}

export const baseCommand: BaseCommand = {
    name: "",

    params: {},

    canExecute() {
        return true
    },

    shouldExecute() {
        return true
    },

    canUndo() {
        return true
    },

    init() {},

    execute() {},

    undo() {},

    shortcuts: [],

    isMind,

    getSelectedNodes,

    getSelectedEdges,

    setSelectedNode(graph, id) {
        const autoPaint = graph.get("autoPaint")

        graph.setAutoPaint(false)

        const selectedNodes = this.getSelectedNodes(graph)

        selectedNodes.forEach(node => {
            if (node.hasState(ItemState.Selected)) {
                graph.setItemState(node, ItemState.Selected, false)
            }
        })

        graph.setItemState(id, ItemState.Selected, true)
        graph.setAutoPaint(autoPaint)
        graph.paint()
    },

    editSelectedNode(graph) {
        graph.emit(EditorEvent.onLabelStateChange, {
            labelState: LabelState.Show
        })
    }
}

commandManager.register("base", baseCommand)
