# Independent lm, confint, pt, dt and qt checks for the regression-focused page.
# Run from the course repository root; relative paths also work in non-ASCII folders on Windows.
qa <- 'qa/lecture07-inversion'
points <- read.csv(file.path(qa, 'points.csv'))
result <- lapply(split(points, points$case), function(d) {
  fit <- lm(y~x, data=d); level <- d$level[1]/100; ci <- confint(fit, 'x', level=level)
  data.frame(case=d$case[1], slope=unname(coef(fit)[2]), intercept=unname(coef(fit)[1]),
    sd=sigma(fit), se=coef(summary(fit))[2,2], sxx=sum((d$x-mean(d$x))^2),
    lower=ci[1], upper=ci[2], critical=qt((1+level)/2,nrow(d)-2))
})
write.csv(do.call(rbind,result), file.path(qa,'r-fits.csv'), row.names=FALSE)
p <- read.csv(file.path(qa,'probability-input.csv'))
p$p <- 2*pt(-abs(p$t),p$df);p$density <- dt(p$t,p$df)
write.csv(p,file.path(qa,'r-probabilities.csv'),row.names=FALSE)
cat('Checked',length(result),'regressions and',nrow(p),'t-distribution values in R.\n')
