import React from "react";
import { Link } from "react-router-dom";
import { tradeData } from "../data/data";
import {FiArrowRight} from '../assets/icons/vander'


export default function Trade(){
    return(
        <>
            <table className="table mb-0 table-center">
                <thead>
                    <tr>
                        <th scope="col" className="fw-normal text-muted py-4" style={{minWidth:'250px'}}>Name</th>
                        <th scope="col" className="fw-normal text-muted py-4" style={{width: '150px'}}>Price</th>
                        <th scope="col" className="fw-normal text-muted py-4" style={{width: '150px'}}>Change(%)</th>
                        <th scope="col" className="fw-normal text-muted py-4" style={{width: '150px'}}>Change($)</th>
                        <th scope="col" className="fw-normal text-muted py-4" style={{width: '150px'}}>Marketcap</th>
                        <th scope="col" className="fw-normal text-end text-muted py-4" style={{width: '100px'}}>Trade</th>
                    </tr>
                </thead>

                <tbody>
                    {tradeData.map((item,index) =>{
                        return(
                            <tr key={index}>
                                <th className="py-3">
                                    <div className="align-items-center">
                                        <img src={item.image} className="me-3" height="32" alt=""/>
                                        <p className="mb-0 d-inline fw-normal h6">{item.name} <span className="text-muted">{item.tag}</span> </p>
                                    </div>
                                </th>
                                <td>{item.price}</td>
                                <td className={item.profit === true ? "text-success" : "text-danger"}>{item.change1}</td>
                                <td className={item.profit === true ? "text-success" : "text-danger"}>{item.change2}</td>
                                <td className="text-muted">{item.marketcap}</td>
                                <td className="text-end"><Link to="#" className="btn btn-sm btn-soft-primary">Trade</Link></td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            <div className="text-center d-block d-md-none mt-4">
                <Link to="/market-price" className="text-primary">See Marketplace <FiArrowRight /></Link>
            </div>
        </>
    )
}