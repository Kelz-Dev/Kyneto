import React from "react";
import { Link } from "react-router-dom";
import { aboutData } from "../data/data";

export default function About(){
    return(
        <div className="row justify-content-center">
            {aboutData.map((item, index) =>{
                let Icon = item.icon
                return(
                <div className="col-lg-4 col-md-6 mt-4 pt-2" key={index}>
                    <div className="feature feature-primary feature-clean text-center rounded px-4">
                        <div className="icons text-center">
                            <Icon className="d-block mx-auto rounded h3 mb-0 icon"/>
                        </div>
                        <div className="content mt-4">
                            <Link to="/features" className="text-dark h5 title">{item.title}</Link>
                            <p className="text-muted mt-3 mb-0">{item.desc}</p>
                            <div className="mt-2">
                                <Link to="/features" className="link">Read More</Link>
                            </div>
                        </div>
                    </div>
                </div>
                )
            })}
        </div>
    )
}