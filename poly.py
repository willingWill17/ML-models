import numpy as np
class PolynomialFeaturesCustom:
    def __init__(self, degree=2, include_bias=False):
        self.degree = degree
        self.include_bias = include_bias

    def fit(self, X):
        from itertools import combinations_with_replacement
        self.n_features_in_ = X.shape[1]
        self.combos = [()] if self.include_bias else []
        for d in range(1, self.degree + 1):
            self.combos.extend(combinations_with_replacement(range(self.n_features_in_), d))
        return self

    def transform(self, X):
        n_samples = X.shape[0]
        X_new = np.empty((n_samples, len(self.combos)), dtype=X.dtype)
        for i, comb in enumerate(self.combos):
            X_new[:, i] = np.prod(X[:, comb], axis=1) if comb else np.ones(n_samples)
        return X_new

    def fit_transform(self, X):
        return self.fit(X).transform(X)
    
class LinearRegressionCustom:
    def fit(self, X, y):
        X_b = np.c_[np.ones((X.shape[0], 1)), X]
        self.theta_ = np.linalg.pinv(X_b.T @ X_b) @ X_b.T @ y
        return self

    def predict(self, X):
        X_b = np.c_[np.ones((X.shape[0], 1)), X]
        return X_b @ self.theta_

class PolynomialRegression(LinearRegressionCustom):
    def __init__(self, degree=2, **kwargs):
        self.degree = degree
        self.poly_features = PolynomialFeaturesCustom(degree=degree)
        super().__init__(**kwargs)

    def fit(self, X, y):
        X_poly = self.poly_features.fit_transform(X)
        return super().fit(X_poly, y)

    def predict(self, X):
        X_poly = self.poly_features.transform(X)
        return super().predict(X_poly)  

