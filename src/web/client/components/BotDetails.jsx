/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/sort-comp */
/* eslint-disable no-unused-vars */

import React from 'react'
import { latitudeString, longitudeString } from './Utilities'

let prec = 2

export function BotDetailsComponent(bot) {
    return (
    <div>
        <h2 className="name">{`Bot ${bot?.botId}`}</h2>
        <table>
            <tbody>
                <tr>
                    <td>Status</td>
                    <td>{bot?.missionState?.toLowerCase()?.replaceAll('__', ' ')}</td>
                </tr>
                <tr>
                    <td>Latitude</td>
                    <td>{latitudeString(bot?.location?.lat)}</td>
                </tr>
                <tr>
                    <td>Longitude</td>
                    <td>{longitudeString(bot?.location?.lon)}</td>
                </tr>
                <tr>
                    <td>Depth</td>
                    <td>{bot?.depth?.toFixed(prec)} m</td>
                </tr>
                <tr>
                    <td>Roll</td>
                    <td>{bot?.attitude?.roll?.toFixed(prec)} m</td>
                </tr>
                <tr>
                    <td>Pitch</td>
                    <td>{bot?.attitude?.pitch?.toFixed(prec)} m</td>
                </tr>
                <tr>
                    <td>Yaw</td>
                    <td>{bot?.attitude?.yaw?.toFixed(prec)} m</td>
                </tr>
                <tr>
                    <td>Ground Speed</td>
                    <td>{bot?.speed?.over_ground?.toFixed(prec)} m/s</td>
                </tr>
                <tr>
                    <td>Water Speed</td>
                    <td>{bot?.speed?.over_water?.toFixed(prec)} m/s</td>
                </tr>
                <tr>
                    <td>Salinity</td>
                    <td>{bot?.salinity?.toFixed(prec)}</td>
                </tr>
                <tr>
                    <td>Temperature</td>
                    <td>{bot?.temperature?.toFixed(prec)}</td>
                </tr>
            </tbody>
        </table>
    </div>
    )
}