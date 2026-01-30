import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/user.jpg'
import logoIcon from '../assets/images/icon-gradient.png'

export default function Signup(){
    return(
        <section className="bg-home d-flex align-items-center position-relative" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'center'}}>
            <div className="bg-overlay bg-gradient-primary opacity-8"></div>
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="form-signin p-4 bg-light rounded shadow-md">
                            <form>
                                <Link to="#"><img src={logoIcon} className="avatar avatar-md-md mb-4 d-block mx-auto" alt=""/></Link>
                                <h5 className="mb-3">Register your account</h5>
                            
                                <div className="form-floating mb-2">
                                    <input type="text" className="form-control" id="floatingInput" placeholder="Harry"/>
                                    <label htmlFor="floatingInput">First Name</label>
                                </div>

                                <div className="form-floating mb-2">
                                    <input type="email" className="form-control" id="floatingEmail" placeholder="name@example.com"/>
                                    <label htmlFor="floatingEmail">Email Address</label>
                                </div>

                                <div className="form-floating mb-3">
                                    <input type="password" className="form-control" id="floatingPassword" placeholder="Password"/>
                                    <label htmlFor="floatingPassword">Password</label>
                                </div>
                            
                                <div className="form-check mb-3">
                                    <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"/>
                                    <label className="form-check-label text-muted" htmlFor="flexCheckDefault">I Accept <Link to="#" className="text-primary">Terms And Condition</Link></label>
                                </div>
                
                                <button className="btn btn-primary w-100" type="submit">Register</button>

                                <div className="col-12 text-center mt-3">
                                    <small><small className="text-muted me-2">Already have an account ? </small> <Link to="/login" className="text-dark fw-medium">Sign in</Link></small>
                                </div>

                                <p className="mb-0 text-muted mt-3 text-center">© {new Date().getFullYear()} Kyneto.</p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}