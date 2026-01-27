import React from "react";

import Chart from 'react-apexcharts'
import { chartData } from "../data/data";

export default function Charts(){
  
    return(
        <div className="row">
            {chartData.map((item, index) =>{
                return(
                    <div className="col-lg-3 col-md-6 mt-4 pt-2" key={index}>
                        <div className="card border-0 p-4 rounded shadow position-relative bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <img src={item.image} className="avatar avatar-coin rounded-pill p-1 bg-danger" alt=""/>
                                <span className="text-muted fw-medium">{item.tag}</span>
                            </div>

                            <h6 className="text-dark">{item.name}</h6>

                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <small className={item.profit === true ? "text-success" : "text-danger"}>{item.value1}</small>
                                <small className={item.profit === true ? "text-success" : "text-danger"}>{item.value2}</small>
                                <small className="text-dark">{item.value3}</small>
                            </div>

                            <div className="crypto-chart">
                                <div>
                                    <div id="chart-2"></div>
                                    <Chart options={item.options} series={item.options.series} type={item.type} width={item.width} height={item.height} />
                                </div>
                            </div>
                        </div>
                    </div>  
                )
            })}
        </div>
    )
}