args <- commandArgs(FALSE)
script <- sub('^--file=', '', args[grepl('^--file=',args)][1L])
setwd(dirname(normalizePath(script,mustWork=TRUE)))
qa <- '../../qa/lecture06-testing'
dir.create(qa,recursive=TRUE,showWarnings=FALSE)
y <- read.csv('mean_sample.csv')$y
tests <- data.frame(candidate=c(45,50,51.7),mean=mean(y),se=sd(y)/sqrt(length(y)))
tests$t <- (tests$mean-tests$candidate)/tests$se
tests$p <- 2*pt(-abs(tests$t),length(y)-1)
write.csv(tests,file.path(qa,'mean-tests.csv'),row.names=FALSE)
grid <- expand.grid(x=c(-6,-3,-1,0,.1,1,2.12,3,6),df=c(4,24,99))
grid$density <- dt(grid$x,grid$df)
grid$p <- 2*pt(-abs(grid$x),grid$df)
write.csv(grid,file.path(qa,'t-reference.csv'),row.names=FALSE)
trade <- data.frame(c=c(2,4,6,8))
trade$one <- 2*pnorm(-trade$c/2)
trade$two <- pnorm((trade$c-5)/2)-pnorm((-trade$c-5)/2)
write.csv(trade,file.path(qa,'error-reference.csv'),row.names=FALSE)
q <- expand.grid(alpha=c(.05,.01),df=c(4,24,99))
q$critical <- qt(1-q$alpha/2,q$df)
write.csv(q,file.path(qa,'critical-reference.csv'),row.names=FALSE)
rejection <- expand.grid(n=c(5,25,100),alpha=c(.05,.01))
rejection$tCritical <- qt(1-rejection$alpha/2,rejection$n-1)
rejection$z <- 2*pnorm(-rejection$tCritical)
rejection$t <- 2*pt(-rejection$tCritical,rejection$n-1)
write.csv(rejection,file.path(qa,'rejection-reference.csv'),row.names=FALSE)
writeLines(c('Saved lecture 6 data; no new real observations are generated.',
 'Simulation: independent N(45,10^2) observations, n=25 or n in {5,25,100}.',
 'Error trade-off: estimate distributed as N(beta1,2^2), beta1=0 or 5.',
 capture.output(sessionInfo())),file.path(qa,'reference-session.txt'))
