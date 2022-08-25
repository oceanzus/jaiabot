/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/sort-comp */
/* eslint-disable no-unused-vars */

import React from 'react'
import Settings from './Settings'

export class MissionSettingsPanel extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            goal: props.goal,
            mission_params: props.mission_params
        }

        this.onClose = props.onClose
        this.onChange = props.onChange
        this.onMissionApply = props.onMissionApply
        this.onMissionChangeEditMode = props.onMissionChangeEditMode
    }

    componentDidUpdate() {
        this.onChange?.()
    }

    render() {
        self = this

        let taskOptionsPanel
        let taskType = this.state.goal.task?.type
        let missionType = this.state.mission_params?.mission_type

        switch (taskType) {
            case 'DIVE':
                taskOptionsPanel = this.diveOptionsPanel()
                break;
            case 'SURFACE_DRIFT':
                taskOptionsPanel = this.driftOptionsPanel()
                break;
            default:
                taskOptionsPanel = <div></div>
                break;
        }

        return (
            <div className="MissionSettingsPanel">
                Mission Settings<hr/>
                <div>
                    <div>
                        <table>
                            <tbody>
                            <tr>
                                <td>Mission Edit Mode:</td>
                                <td>
                                    <select name="mission_type" id="mission-type" defaultValue={missionType ?? "editing"} onChange={evt => self.changeMissionEditMode(evt.target.value) }>
                                        <option value="editing">Editing</option>
                                        <option value="polygon-grid">Polygon</option>
                                        <option value="lines">Lines</option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td>Bot Count</td>
                                <td><input type="number" className="NumberInput" name="num_bots" defaultValue={this.state.mission_params.num_bots} onChange={this.changeMissionParameter.bind(this)} /></td>
                            </tr>
                            <tr>
                                <td>Goals per Bot</td>
                                <td><input type="number" className="NumberInput" name="num_goals" defaultValue={this.state.mission_params.num_goals} onChange={this.changeMissionParameter.bind(this)} /></td>
                            </tr>
                            <tr>
                                <td>Mission Spacing</td>
                                <td><input type="number" className="NumberInput" name="spacing" defaultValue={this.state.mission_params.spacing} onChange={this.changeMissionParameter.bind(this)} /> m</td>
                            </tr>
                            <tr>
                                <td>Mission Orientation</td>
                                <td><input type="number" className="NumberInput" name="orientation" defaultValue={this.state.mission_params.orientation} onChange={this.changeMissionParameter.bind(this)} /> deg</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <hr/>
                    Task
                    <select name="GoalType" id="GoalType" onChange={evt => self.changeTaskType(evt.target.value) } defaultValue={taskType ?? "NONE"}>
                        <option value="NONE">None</option>
                        <option value="DIVE">Dive</option>
                        <option value="SURFACE_DRIFT">Surface Drift</option>
                        <option value="STATION_KEEP">Station Keep</option>
                    </select>

                    { taskOptionsPanel }

                    <hr/>
                    <div className='HorizontalFlexbox'>
                        <button onClick={this.closeClicked.bind(this)}>Close</button>
                        <button onClick={this.applyMissionClicked.bind(this)}>Apply</button>
                    </div>

                    <hr/>
                    Survey Stats
                    <div id="surveyPolygonResults">
                        <table>
                            <tbody>
                            <tr className="missionStats">
                                <td>Area (m^2): </td>
                                <td><div id="surveyPolygonResultArea"></div></td>
                            </tr>
                            <tr className="missionStats">
                                <td>Perimeter (km): </td>
                                <td><div id="surveyPolygonResultPerimeter"></div></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }

    changeMissionParameter(evt) {
        let {mission_params} = this.state

        const key = evt.target.name
        const value = evt.target.value

        mission_params[key] = value

        this.setState({mission_params})
    }

    changeTaskType(taskType) {
        let {goal} = this.state

        if (taskType === goal.task?.type) {
            return
        }

        switch(taskType) {
            case 'DIVE':
                goal.task = {
                    type: taskType,
                    dive: {
                        max_depth: 10,
                        depth_interval: 10,
                        hold_time: 1
                    }
                }
                break;
            case 'SURFACE_DRIFT':
                goal.task = {
                    type: taskType,
                    surface_drift: {
                        drift_time: 10
                    }
                }
                break;
            case 'STATION_KEEP':
                goal.task = {
                    type: taskType
                }
                break;
            default:
                goal.task = null
                break;
        }

        this.setState({goal})
    }

    diveOptionsPanel() {
        let dive = this.state.goal.task.dive

        return (
            <div>
                <table className="DiveParametersTable">
                    <tbody>
                    <tr>
                        <td>Max Depth</td>
                        <td><input type="number" step="1" className="NumberInput" name="max_depth" defaultValue={dive.max_depth} onChange={this.changeDiveParameter.bind(this)} /> m</td>
                    </tr>
                    <tr>
                        <td>Depth Interval</td>
                        <td><input type="number" step="1" className="NumberInput" name="depth_interval" defaultValue={dive.depth_interval} onChange={this.changeDiveParameter.bind(this)} /> m</td>
                    </tr>
                    <tr>
                        <td>Hold Time</td>
                        <td><input type="number" step="1" className="NumberInput" name="hold_time" defaultValue={dive.hold_time} onChange={this.changeDiveParameter.bind(this)} /> s</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        )
    }

    changeDiveParameter(evt) {
        let {goal} = this.state

        const key = evt.target.name
        const value = evt.target.value

        goal.task.dive[key] = value

        this.setState({goal})
    }

    driftOptionsPanel() {
        let surface_drift = this.state.goal.task.surface_drift

        return (
            <div>
                <table className="DiveParametersTable">
                    <tbody>
                    <tr>
                        <td>Drift Time</td>
                        <td><input type="number" step="1" className="NumberInput" name="drift_time" defaultValue={surface_drift.drift_time} onChange={this.changeDriftParameter.bind(this)} /> s</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        )
    }

    changeDriftParameter(evt) {
        let {goal} = this.state

        const key = evt.target.name
        const value = evt.target.value

        goal.task.surface_drift[key] = value

        this.setState({goal})
    }

    closeClicked() {
        this.onClose?.()
    }

    applyMissionClicked() {
        this.onMissionApply?.()
    }

    changeMissionEditMode(missionEditMode) {
        console.log(missionEditMode);
        let {mission_params} = this.state;

        if (missionEditMode === mission_params?.mission_type) {
            return
        }

        switch(missionEditMode) {
            case 'polygon-grid':
                mission_params.mission_type = missionEditMode
                break;
            case 'lines':
                mission_params.mission_type = missionEditMode
                break;
            case 'editing':
                mission_params.mission_type = missionEditMode
                break;
            default:
                mission_params.mission_type = 'editing'
                break;
        }

        this.setState({mission_params});

        this.onMissionChangeEditMode?.()

    }

    applyMissionEditMode() {
        this.onMissionChangeEditMode?.()
    }

    applyClicked() {
        let {goal} = this.state
        this.onApply?.(goal)
    }

}
