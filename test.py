
import numpy as np 
from sklearn.preprocessing import PolynomialFeatures

X = 4 * np.random.rand(100, 1) - 2
y = 4 + 2 * X + 5 * X**2+ np.random.randn(100, 1)

poly_features = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly_features.fit_transform(X)
print(X[50], X.shape)
print(X_poly[50], X_poly.shape)
