# Run from the course repository root. Independent numerical checks in base R.
options(digits=17)
out <- 'qa/lecture08-inference'
m <- function(x) 60+6*x-.3*x*x
populations <- do.call(rbind,lapply(c('uniform','short','long'),function(kind){
  mu <- if(kind=='short') 2 else 8
  d <- if(kind=='uniform') function(x) rep(.1,length(x)) else function(x) dnorm(x,mu,3)/(pnorm(10,mu,3)-pnorm(0,mu,3))
  avg <- function(f) integrate(function(x) f(x)*d(x),0,10,rel.tol=1e-12)$value
  ex<-avg(function(x)x);ey<-avg(m);vx<-avg(function(x)(x-ex)^2)
  slope<-avg(function(x)(x-ex)*(m(x)-ey))/vx;intercept<-ey-slope*ex
  variance<-avg(function(x)(x-ex)^2*(100+(m(x)-intercept-slope*x)^2))/vx^2
  data.frame(kind,ex,ey,vx,slope,intercept,variance)
}))
write.csv(populations,file.path(out,'reference-populations.csv'),row.names=FALSE)
data<-read.csv(file.path(out,'reference-samples.csv'))
groups<-split(data,interaction(data$kind,data$n,data$replicate,drop=TRUE))
fits<-do.call(rbind,lapply(groups,function(d){
  fit<-lm(y~x,data=d);design<-model.matrix(fit);bread<-solve(crossprod(design));res<-residuals(fit)
  hc0<-bread %*% crossprod(design,design*res^2) %*% bread
  data.frame(kind=d$kind[1],n=d$n[1],replicate=d$replicate[1],intercept=unname(coef(fit)[1]),slope=unname(coef(fit)[2]),se=sqrt(hc0[2,2]))
}))
write.csv(fits,file.path(out,'reference-fits.csv'),row.names=FALSE)
levels<-c(.9,.95,.99)
write.csv(data.frame(level=levels,critical=qnorm((1+levels)/2)),file.path(out,'reference-criticals.csv'),row.names=FALSE)
cat('Saved independent population moments, 18 OLS/HC0 fits, and normal quantiles.\n')
