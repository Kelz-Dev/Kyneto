import React from "react";
import { Link } from "react-router-dom";

import bg1 from '../assets/images/bg/user.jpg'
import logoIcon from '../assets/images/icon-gradient.png'

export default function ResetPassword(){
    return(
        <>
         <section className="bg-home d-flex align-items-center position-relative" style={{backgroundImage:`url(${bg1})`, backgroundPosition:'center'}}>
            <div className="bg-overlay bg-gradient-primary opacity-8"></div>
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="form-signin p-4 bg-light rounded shadow-md">
                            <form>
                                <Link to="/index"><img src={logoIcon} className="avatar avatar-md-md mb-4 d-block mx-auto" alt=""/></Link>
                                <h5 className="mb-3">Reset your password</h5>

                                <p className="text-muted">Please enter your email address. You will receive a link to create a new password via email.</p>
                            
                                <div className="form-floating mb-3">
                                    <input type="email" className="form-control" id="floatingInput" placeholder="name@example.com"/>
                                    <label htmlFor="floatingInput">Email address</label>
                                </div>
                
                                <button className="btn btn-primary w-100" type="submit">Send</button>

                                <div className="col-12 text-center mt-3">
                                    <small><small className="text-muted me-2">Remember your password ? </small> <Link to="/login" className="text-dark fw-medium">Sign in</Link></small>
                                </div>

                                <p className="mb-0 text-muted mt-3 text-center">© {new Date().getFullYear()} Cryptor.</p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}