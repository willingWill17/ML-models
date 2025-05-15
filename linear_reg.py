import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

class HandmadeLinearRegression:
    def __init__(self):
        self.w = None

    def predict(self, X):
        return X.dot(self.w[1:]) + self.w[0]

    def fit(self, X, Y):
        pass


class NormalEquation(HandmadeLinearRegression):
    def addBias(self, X):
        return np.concatenate((np.ones((X.shape[0], 1)), X), axis=1)

    def _fit(self, X, Y):
        self.w = np.linalg.pinv(X.T @ X) @ (X.T @ Y)

    def fit(self, X, Y):
        XBias = self.addBias(X)
        self._fit(XBias, Y)
