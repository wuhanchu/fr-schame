import isArray from "lodash/isArray"
import { guid } from "@/outter/gg-editor/utils"
import {
    ADD_NODE_MODEL,
    ADD_NODE_DELEGATE_SHAPE,
    GraphType,
    GraphMode,
    EditorCommand,
    ItemType
} from "@/outter/gg-editor/common/constants"
import {
    NodeModel,
    Behavior,
    GraphEvent
} from "@/outter/gg-editor/common/interfaces"
import { G } from "@antv/g6/types/g"
import commandManager from "@/outter/gg-editor/common/commandManager"
import behaviorManager from "@/outter/gg-editor/common/behaviorManager"

interface DragAddNodeBehavior extends Behavior {
    shape: G.Shape | null
    handleCanvasMouseEnter(e: GraphEvent): void
    handleMouseMove(e: GraphEvent): void
    handleMouseUp(e: GraphEvent): void
}

const dragAddNodeBehavior: DragAddNodeBehavior = {
    shape: null,

    graphType: GraphType.Flow,

    graphMode: GraphMode.AddNode,

    getEvents() {
        return {
            "canvas:mouseenter": "handleCanvasMouseEnter",
            mousemove: "handleMouseMove",
            mouseup: "handleMouseUp"
        }
    },

    handleCanvasMouseEnter(e) {
        const { graph, shape } = this

        if (shape) {
            return
        }

        const group: G.Group = graph.get("group")
        const model: NodeModel = graph.get(ADD_NODE_MODEL)

        const { size = 100 } = model

        let width = 0
        let height = 0

        if (isArray(size)) {
            width = size[0]
            height = size[1]
        } else {
            width = size
            height = size
        }

        const x = e.x - width / 2
        const y = e.y - height / 2

        this.shape = group.addShape("rect", {
            className: ADD_NODE_DELEGATE_SHAPE,
            attrs: {
                x,
                y,
                width,
                height,
                fill: "#f3f9ff",
                fillOpacity: 0.5,
                stroke: "#1890ff",
                strokeOpacity: 0.9,
                lineDash: [5, 5]
            }
        })

        graph.paint()
    },

    handleMouseMove(e) {
        const { graph } = this
        const { width, height } = this.shape.getBBox()

        const x = e.x - width / 2
        const y = e.y - height / 2

        this.shape.attr({
            x,
            y
        })

        graph.paint()
    },

    handleMouseUp(e) {
        console.debug("handleMouseUp")
        const { graph } = this
        const { width, height } = this.shape.getBBox()

        let x = e.x
        let y = e.y

        const model: NodeModel = graph.get(ADD_NODE_MODEL)

        if (model.center === "topLeft") {
            x -= width / 2
            y -= height / 2
        }

        this.shape.remove(true)

        commandManager.execute(graph, EditorCommand.Add, {
            type: ItemType.Node,
            model: {
                id: guid(),
                x,
                y,
                ...model
            }
        })
    }
}

behaviorManager.register("drag-add-node", dragAddNodeBehavior)
