import React from "react"
import { EditorEvent } from "@/outter/gg-editor/common/constants"
import { GraphStateEvent } from "@/outter/gg-editor/common/interfaces"
import commandManager from "@/outter/gg-editor/common/commandManager"
import {
    EditorContextProps,
    withEditorContext
} from "@/outter/gg-editor/components/EditorContext"

interface CommandProps extends EditorContextProps {
    name: string
    className?: string
    disabledClassName?: string
}

interface CommandState {}

class Command extends React.Component<CommandProps, CommandState> {
    static defaultProps = {
        className: "command",
        disabledClassName: "command-disabled"
    }

    state = {
        disabled: false
    }

    componentDidMount() {
        const { graph, name } = this.props

        this.setState({
            disabled: !commandManager.canExecute(graph, name)
        })

        graph.on<GraphStateEvent>(EditorEvent.onGraphStateChange, () => {
            this.setState({
                disabled: !commandManager.canExecute(graph, name)
            })
        })
    }

    handleClick = async () => {
        const { name, executeCommand, params } = this.props
        await executeCommand(name, params)
    }

    render() {
        const { graph } = this.props

        if (!graph) {
            return null
        }

        const { className, disabledClassName, children } = this.props
        const { disabled } = this.state

        return (
            <div
                className={`${className}${
                    disabled ? ` ${disabledClassName}` : ""
                }`}
                onClick={this.handleClick}
            >
                {children}
            </div>
        )
    }
}

export default withEditorContext<CommandProps>(Command)
