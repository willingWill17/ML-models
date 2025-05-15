from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Any
from fastapi.middleware.cors import CORSMiddleware

import torch
import numpy as np

from Project.LRmodels import NormalEquation
from Project.Polymodels import PolynomialRegression
from Project.SVRmodels import HandmadeSVR as SVR

class Request(BaseModel):
    data: List[Any]
    functionType: str
    C: float
    epsilon: float

class Response(BaseModel):
    weights: List[int]
    
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

def make_data(data):
    X, y = [], []
    for i in data:
        X.append(i['x'])
        y.append(i['y'])
    return np.array(X), np.array(y)
@app.post("/process")
async def process_data(request: Request):
    print(request)
    if request.functionType == "linear":
        X, y = make_data(request.data)
        X = X.reshape(-1,1)
        model = NormalEquation()
        model.fit(X,y)
        return {
            "weights" : [round(float(wi), 2) for wi in model.w]
        }
    elif request.functionType == "polynomial":
        X, y = make_data(request.data)
        X = X.reshape(-1,1)
        model = PolynomialRegression()
        model.fit(X,y)
        print(model.theta_)
        return {
            "weights" : [round(float(wi), 2) for wi in model.theta_]
        }   
    elif request.functionType == "svr":
        X, y = make_data(request.data)
        X = X.reshape(-1,1)
        model = SVR(C=request.C, epsilon=request.epsilon)
        model.fit(X,y)
        output = [model.w[0], model.b]
        print(output)
        return {
            "weights" : output
        }   
    
