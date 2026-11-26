# Rebuild from the saved lecture 8 data. All scientific graphics are drawn in R.
# Run from the workspace root: Rscript --vanilla <this file>
options(stringsAsFactors = FALSE, digits = 15)
args <- commandArgs(trailingOnly = FALSE)
script <- normalizePath(sub('^--file=', '', args[grepl('^--file=', args)]), winslash='/')
course <- dirname(dirname(dirname(script)))
workspace <- dirname(dirname(dirname(course)))
src <- file.path(workspace, 'output/pdf/lecture08_whiteboard')
out <- file.path(course, 'docs/lecture08/assets/figures')
if(dir.exists(file.path(dirname(script),'input'))) src <- file.path(dirname(script),'input')
custom <- commandArgs(trailingOnly=TRUE)
if(length(custom)==2) {src <- normalizePath(custom[1],winslash='/');out <- custom[2]}
dir.create(out, recursive=TRUE, showWarnings=FALSE)
read <- function(x, folder='data') read.csv(file.path(src, folder, x))
star <- read('star_sample.csv'); oats <- read('oats_sample.csv')
samples <- read('inference_sample_examples.csv'); reps <- read('inference_replicates.csv')
md <- read('model_comparison_samples.csv'); mc <- read('model_comparison_curves.csv')
mp <- read('model_comparison_pointwise.csv', 'results')
changes <- read('model_local_changes.csv', 'results')
simpson <- read('simpson_sample.csv')
star_est <- read('star_inference.csv','results'); oats_est <- read('oats_inference.csv','results')
ink <- '#20313b'; blue <- '#08658a'; orange <- '#bd5227'; green <- '#287451'; purple <- '#7851a0'; gray <- '#7b858c'
esc <- function(x) {x <- gsub('&','&amp;',x,fixed=TRUE); x <- gsub('<','&lt;',x,fixed=TRUE); gsub('"','&quot;',x,fixed=TRUE)}
f <- function(x) formatC(x, digits=2, format='f')
buf <- character()
emit <- function(x) buf <<- c(buf,x)
txt <- function(x,y,label,size=22,col=ink,anchor='start',extra='') emit(sprintf('<text x="%s" y="%s" font-size="%s" fill="%s" text-anchor="%s" %s>%s</text>',f(x),f(y),size,col,anchor,extra,esc(label)))
line <- function(x1,y1,x2,y2,col=ink,width=3,dash='',extra='') emit(sprintf('<path d="M%s %s L%s %s" fill="none" stroke="%s" stroke-width="%s" %s %s/>',f(x1),f(y1),f(x2),f(y2),col,width,if(nchar(dash)) paste0('stroke-dasharray="',dash,'"') else '',extra))
dot <- function(x,y,col=gray,r=4,extra='') emit(sprintf('<circle cx="%s" cy="%s" r="%s" fill="%s" %s/>',f(x),f(y),r,col,extra))
rect <- function(x,y,w,h,fill,extra='') emit(sprintf('<rect x="%s" y="%s" width="%s" height="%s" fill="%s" %s/>',f(x),f(y),f(w),f(h),fill,extra))
layer <- function(id, expr) {emit(paste0('<g data-layer="',id,'">')); force(expr); emit('</g>')}
start <- function(label) {buf <<- character(); emit(paste0('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img" aria-label="',esc(label),'">')); emit('<defs><clipPath id="plot-clip"><rect x="84" y="46" width="764" height="386"/></clipPath></defs>')}
finish <- function(name) {append_annotations(name);emit('</svg>'); writeLines(enc2utf8(buf), file.path(out,paste0(name,'.svg')),useBytes=TRUE)}
xlim <- c(0,10); ylim <- c(45,115)
sx <- function(x) 84+764*(x-xlim[1])/diff(xlim)
sy <- function(y) 432-386*(y-ylim[1])/diff(ylim)
axes <- function(xr,yr,xt,yt,xlabel,ylabel) {
 xlim <<- xr; ylim <<- yr
 line(84,46,84,432,col='#b5bfc4',width=1.5); line(84,432,848,432,col='#b5bfc4',width=1.5)
 for(v in xt) {line(sx(v),432,sx(v),440,col=gray,width=1);txt(sx(v),467,as.character(v),19,anchor='middle')}
 for(v in yt) {line(77,sy(v),84,sy(v),col=gray,width=1);txt(68,sy(v)+7,as.character(v),19,anchor='end')}
 txt(466,507,xlabel,22,anchor='middle'); txt(84,26,ylabel,22)
}
curve <- function(x,y,col=blue,width=3.5,dash='',extra='') {
 d <- paste0('M',paste(paste(f(sx(x)),f(sy(y))),collapse=' L'))
 emit(sprintf('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" %s %s/>',d,col,width,if(nchar(dash)) paste0('stroke-dasharray="',dash,'"') else '',extra))
}
points <- function(x,y,col=gray,r=4,extra='') {emit('<g clip-path="url(#plot-clip)">'); for(i in seq_along(x)) dot(sx(x[i]),sy(y[i]),col,r,extra); emit('</g>')}
vline <- function(x,col=orange,dash='7 6',extra='') line(sx(x),46,sx(x),432,col,2.5,dash,extra)
legend <- function(y,items,cols) {for(i in seq_along(items)){xx<-100+(i-1)*248;line(xx,y,xx+30,y,cols[i],4);txt(xx+41,y+7,items[i],20,cols[i])}}
m <- function(x) 60+6*x-.3*x^2
xx <- seq(0,10,length.out=201)
source(file.path(dirname(script),'annotations.R'),encoding='UTF-8')
write_ink_templates()

# One scatter remains in place while means and the difference are added.
start('通常学級と少人数学級の読解得点')
axes(c(-.5,1.5),c(300,650),c(0,1),c(300,400,500,600),'学級の種類 D','読解得点 Y')
layer('points',points(star$x_display,star$Y,'#929ca3',2.3,'opacity=".34"'))
means <- tapply(star$Y,star$D,mean)
layer('means',{for(i in 0:1){line(sx(i-.15),sy(means[i+1]),sx(i+.15),sy(means[i+1]),green,5,extra='data-draw="true"');dot(sx(i),sy(means[i+1]),green,7);txt(sx(i),sy(means[i+1])-25,sprintf('%.2f',means[i+1]),27,green,'middle')}})
layer('difference',{line(sx(0),sy(means[1]),sx(1),sy(means[1]),blue,2,'5 6'); line(sx(1),sy(means[1]),sx(1),sy(means[2]),blue,5,extra='data-draw="true"');txt(sx(.5),sy(means[1])+52,'平均差 5.82 点',27,blue,'middle')})
finish('star')

# Coefficient intervals; the same interval stays when the decision threshold moves.
for(kind in c('star','oats')){
 d <- if(kind=='star')star_est else oats_est
 limits <- if(kind=='star')c(-1,12) else c(7,18)
 start(if(kind=='star')'少人数学級の平均得点差の区間と判断基準' else '窒素の増収量の区間と費用回収の基準')
 axes(limits,c(0,1),if(kind=='star')c(0,2,4,6,8,10,12) else c(8,10,12,14,16,18),numeric(),if(kind=='star')'平均得点差（点）' else '窒素1 kg当たりの増収量（kg）','')
 layer('zero',vline(if(kind=='star')0 else 10,gray))
 layer('estimate',{dot(sx(d$slope),sy(.53),blue,9);txt(sx(d$slope),sy(.53)-35,sprintf('推定値 %.2f',d$slope),29,blue,'middle')})
 layer('interval',{line(sx(d$lower),sy(.53),sx(d$upper),sy(.53),blue,7,extra='data-draw="true"');for(v in c(d$lower,d$upper)){line(sx(v),sy(.53)-15,sx(v),sy(.53)+15,blue,3);txt(sx(v),sy(.53)+49,sprintf('%.2f',v),25,blue,'middle')}})
 a<-if(kind=='star')2 else 10;b<-if(kind=='star')8 else 13
 layer('threshold',{vline(a,orange,extra=sprintf('id="threshold-line" data-shift="%s"',f(sx(b)-sx(a))));txt(sx(a),84,paste('基準',a),25,orange,'middle',extra=sprintf('id="threshold-label" data-shift="%s"',f(sx(b)-sx(a))))})
 finish(paste0(kind,'-interval'))
}
start('窒素投入量と収穫量')
axes(c(-3,79),c(1000,4800),c(0,25.1,50.2,75.3),c(1000,2000,3000,4000),'窒素投入量（kg/ha）','収穫量（kg/ha）')
layer('points',points(oats$X,oats$Y,gray,4.2,'opacity=".65"'))
oy<-mean(oats$Y);ox<-mean(oats$X)
layer('fit',curve(c(0,75.32),oy+oats_est$slope*(c(0,75.32)-ox),blue,4,extra='data-draw="true"'))
layer('bounds',{for(b in c(oats_est$lower,oats_est$upper))curve(c(0,75.32),oy+b*(c(0,75.32)-ox),purple,3,'8 7',extra='data-draw="true"')})
finish('oats')

start('非線形の条件付き期待値と線形射影')
axes(c(0,10),c(45,115),c(0,2,4,6,8,10),c(50,70,90,110),'補習時間 X','得点 Y')
layer('truth',curve(xx,m(xx),orange,4,extra='data-draw="true"'))
layer('projection',curve(xx,65+3*xx,blue,4,extra='data-draw="true"'))
for(k in 1:3){d<-subset(samples,n==40 & replicate==k);b<-subset(reps,n==40 & replicate==k)
 layer(paste0('sample',k),points(d$X,d$Y,gray,4.5,'opacity=".7"'))
 layer(paste0('fit',k),curve(c(0,10),b$intercept+b$slope*c(0,10),green,3.5,'9 6',extra='data-draw="true"'))
}
layer('gap',{for(x in c(1,3,5,7,9))line(sx(x),sy(m(x)),sx(x),sy(65+3*x),orange,3)})
for(n0 in c(40,240,960))layer(paste0('repeat',n0),{d<-subset(reps,n==n0 & replicate<=100);for(i in seq_len(nrow(d)))curve(c(0,10),d$intercept[i]+d$slope[i]*c(0,10),green,1.3,extra='opacity=".25"')})
finish('projection')

start('右に歪んだ誤差の分布')
axes(c(-10,50),c(0,.1),c(-10,0,10,20,30,40,50),c(0,.05,.1),'誤差 U','密度')
layer('density',curve(seq(-10,50,length.out=200),dexp(seq(0,60,length.out=200)/10)/10,orange,4,extra='data-draw="true"'))
layer('mean',vline(0,blue))
finish('error')

# Fixed bins allow bars to move continuously when sample size changes.
start('標本サイズとOLSの傾きの分布')
axes(c(.5,5.5),c(0,3.8),seq(1,5),c(0,1,2,3),'傾きの推定値','密度')
hs <- lapply(c(40,240,960),function(nn)hist(subset(reps,n==nn)$slope,breaks=seq(-1,7,.1),plot=FALSE))
layer('bars',{for(i in seq_along(hs[[1]]$counts)){x<-hs[[1]]$breaks[i]; if(x>=.5 && x<5.5){attrs<-paste(vapply(1:3,function(j)sprintf('data-y%d="%s" data-h%d="%s"',j,f(sy(hs[[j]]$density[i])),j,f(432-sy(hs[[j]]$density[i]))),''),collapse=' ');rect(sx(x)+1,sy(hs[[1]]$density[i]),764/50-2,432-sy(hs[[1]]$density[i]),'#9bbfce',paste0('class="morph-bar" ',attrs))}}})
layer('target',vline(3,blue));finish('sampling')

start('標準化した推定誤差と標準正規分布')
axes(c(-4,4),c(0,.48),c(-4,0,4),c(0,.2,.4),'標準化した推定誤差 Z','密度')
z<-subset(reps,n==240)$statistic;hz<-hist(z,breaks=seq(floor(min(z))-.5,ceiling(max(z))+.5,.25),plot=FALSE)
layer('bars',{for(i in seq_along(hz$counts)){x<-hz$breaks[i];if(x>=-4&&x<4)rect(sx(x)+1,sy(hz$density[i]),764/32-2,432-sy(hz$density[i]),'#b9cfd9')}})
layer('normal',curve(seq(-4,4,length.out=241),dnorm(seq(-4,4,length.out=241)),blue,4,extra='data-draw="true"'))
layer('central',{x<-seq(-1.96,1.96,length.out=120);emit(paste0('<path d="M',f(sx(x[1])),' 432 L',paste(paste(f(sx(x)),f(sy(dnorm(x)))),collapse=' L'),' L',f(sx(tail(x,1))),' 432 Z" fill="',blue,'" opacity=".14"/>'));for(v in c(-1.96,1.96)){vline(v,orange);txt(sx(v),465,as.character(v),21,orange,'middle')}})
finish('normal')

start('一つの標本から95パーセント信頼区間へ')
axes(c(1.8,4.3),c(0,1),c(2,2.5,3,3.5,4),numeric(),'線形射影係数の候補 b','')
obs<-subset(reps,n==240 & replicate==1)
layer('estimate',{dot(sx(obs$slope),sy(.55),blue,9);txt(sx(obs$slope),sy(.55)-40,'3.128',30,blue,'middle')})
layer('se',{line(sx(obs$slope),sy(.55),sx(obs$slope+obs$se),sy(.55),green,6,extra='data-draw="true"');txt(sx(obs$slope+obs$se/2),sy(.55)+56,'1 SE',25,green,'middle')})
layer('interval',{line(sx(obs$lower),sy(.55),sx(obs$slope),sy(.55),blue,7,extra='data-draw="true"');line(sx(obs$slope),sy(.55),sx(obs$upper),sy(.55),blue,7,extra='data-draw="true"');for(v in c(obs$lower,obs$upper)){line(sx(v),sy(.55)-15,sx(v),sy(.55)+15,blue,3);txt(sx(v),sy(.55)+52,sprintf('%.3f',v),26,blue,'middle')}})
layer('candidate',{vline(3,orange,extra=sprintf('id="candidate-line" data-shift="%s"',f(sx(4)-sx(3))));txt(sx(3),91,'候補 3',27,orange,'middle',extra=sprintf('id="candidate-label" data-shift="%s"',f(sx(4)-sx(3))))})
finish('interval')

start('繰り返し作った区間と真の線形射影係数')
axes(c(1.8,4.3),c(0,31),c(2,2.5,3,3.5,4),numeric(),'線形射影係数の候補','標本ごとの95%信頼区間')
d<-subset(reps,n==240 & replicate<=30)
for(k in 1:3)layer(paste0('batch',k),{idx<-if(k==1)1 else if(k==2)2:10 else 11:30;for(i in idx){yy<-sy(31-i);co<-if(d$cover[i])blue else orange;line(sx(d$lower[i]),yy,sx(d$upper[i]),yy,co,3,extra='data-draw="true"');dot(sx(d$slope[i]),yy,co,3.7)}})
layer('target',vline(3,ink,'6 6'))
finish('intervals')

# Rejection is the complement of interval coverage for the SAME replications.
start('信頼区間と仮説検定の対応')
axes(c(1.8,4.3),c(0,31),c(2,2.5,3,3.5,4),numeric(),'線形射影係数の候補','同じ30標本')
layer('intervals',{for(i in seq_len(nrow(d))){co<-if(d$cover[i])blue else orange;line(sx(d$lower[i]),sy(31-i),sx(d$upper[i]),sy(31-i),co,3)}})
layer('target',vline(3,ink,'6 6'))
layer('decisions',{for(i in seq_len(nrow(d)))if(!d$cover[i])txt(825,sy(31-i)+6,'棄却',18,orange,'end')})
finish('test-intervals')

# Model comparison uses saved curves, without generating new samples.
getcurve <- function(scenario0='curved',n0=50,j=1,k=1) subset(mc,scenario==scenario0 & n==n0 & model==j & replicate==k)
drawmodel <- function(scenario0='curved',n0=50,j=1,k=1,col=blue,width=3.5,extra='data-draw="true"'){d<-getcurve(scenario0,n0,j,k);curve(d$X,d$prediction,col,width,extra=extra)}
modelaxes <- function(scenario0) {if(scenario0=='curved')axes(c(0,10),c(45,105),seq(0,10,2),c(50,70,90),'補習時間 X','得点 Y') else axes(c(50,150),c(20,85),seq(50,150,25),c(20,40,60,80),'用意する弁当（食）','総費用（千円）')}
for(sc in c('curved','linear')){
 start(if(sc=='curved')'同じ補習データに当てはめる三つのモデル' else '弁当の食数と総費用を表す三つのモデル')
 modelaxes(sc);d<-subset(md,scenario==sc & n==50 & replicate==1)
 layer('points',points(d$X,d$Y,gray,4.5,'opacity=".72"'))
 for(j in 1:3)layer(paste0('fit',j),drawmodel(sc,50,j,1,c(blue,green,purple)[j]))
 layer('truth',{x<-if(sc=='curved')xx else seq(50,150,.5);curve(x,if(sc=='curved')m(x) else 20+.34*x,orange,4,'8 6',extra='data-draw="true"')})
 layer('gain',{for(pair in if(sc=='curved')list(c(2,4),c(6,8)) else list(c(100,120))){x<-pair;y<-if(sc=='curved')m(x) else 20+.34*x;line(sx(x[1]),sy(y[1]),sx(x[2]),sy(y[1]),orange,3);line(sx(x[2]),sy(y[1]),sx(x[2]),sy(y[2]),orange,4,extra='data-draw="true"');for(i in 1:2)dot(sx(x[i]),sy(y[i]),orange,6);txt(mean(sx(x)),sy(mean(y))-24,sprintf('%.1f',diff(y)),27,orange,'middle')}})
 finish(sc)
}
start('近い観測を使う局所線形回帰')
modelaxes('curved'); d<-subset(md,scenario=='curved' & n==50 & replicate==1)
layer('all',points(d$X,d$Y,'#b9c2c7',4.2))
for(k in 1:2){h<-c(1.6,.8)[k];x0<-4;w<-exp(-.5*((d$X-x0)/h)^2);b<-coef(lm(Y~X,data=d,weights=w))
 layer(paste0('weights',k),{for(i in seq_len(nrow(d)))dot(sx(d$X[i]),sy(d$Y[i]),green,3+5*w[i],sprintf('opacity="%.3f"',.15+.85*w[i]));curve(c(x0-2,x0+2),b[1]+b[2]*c(x0-2,x0+2),green,4,extra='data-draw="true"');dot(sx(x0),sy(b[1]+b[2]*x0),green,9)})
}
layer('location',vline(4,ink));layer('fit',drawmodel('curved',50,3,1,green));finish('local')

# Keep one large, legible coordinate system while the model changes.
for(sc in c('curved','linear')){
 start(paste('標本を取り直したときのモデルの変動',sc))
 modelaxes(sc)
 for(n0 in c(50,200))for(j in 1:3){
 layer(paste0('repeats',n0,'_',j),{for(k in 1:30)drawmodel(sc,n0,j,k,c(blue,green,purple)[j],2,extra='opacity=".23"')})
 layer(paste0('expected',n0,'_',j),{d<-subset(mp,scenario==sc&n==n0&model==j);curve(d$X,d$expected,ink,4.5,extra='data-draw="true"')})
 }
 layer('truth',{x<-if(sc=='curved')xx else seq(50,150,.5);curve(x,if(sc=='curved')m(x) else 20+.34*x,orange,4,'8 6')})
 finish(paste0(sc,'-repeats'))
}

start('改善幅の逓減の推定値の分布')
axes(c(-20,28),c(0,.19),c(-20,-10,0,10,20),c(0,.1),'推定した改善幅の差 Δ̂(2) − Δ̂(6)','密度')
layer('linear',{line(sx(0),432,sx(0),90,blue,6,extra='data-draw="true"');txt(sx(0)-15,84,'直線では常に0',23,blue,'end')})
for(j in 2:3)layer(paste0('model',j),{d<-density(subset(changes,n==50 & model==j)$diminishing_amount,from=-20,to=28,n=300);curve(d$x,d$y,c(green,purple)[j-1],4,extra='data-draw="true"')})
layer('target',{vline(4.8,orange);txt(sx(4.8)+12,76,'母集団の差 4.8',23,orange)})
finish('gains')

start('訓練データの変動と未使用データへの予測')
axes(c(130,150),c(50,85),c(130,140,150),c(50,60,70,80),'用意する弁当（食）','総費用（千円）')
d<-subset(md,scenario=='linear'&n==50&replicate==1&X>=130)
layer('train',points(d$X,d$Y,gray,6))
for(j in c(1,3))layer(paste0('fit',j),{c<-getcurve('linear',50,j,1);c<-subset(c,X>=130);curve(c$X,c$prediction,c(blue,green,purple)[j],4,extra='data-draw="true"')})
layer('unused',{for(i in 1:nrow(d)){x<-sx(d$X[i]);y<-sy(d$Y_unused[i]);emit(sprintf('<path d="M%s %s l-6 11 h12 Z" fill="%s"/>',f(x),f(y-7),ink))}})
layer('truth',curve(c(130,150),20+.34*c(130,150),orange,4,'8 6'))
finish('overfit')

# Group coloring acts on the SAME circles; their coordinates never change.
start('全体の傾向と群内の傾向')
axes(c(0,10),c(30,105),seq(0,10,2),c(40,60,80,100),'補習時間 X','得点 Y')
layer('points',{for(i in seq_len(nrow(simpson)))dot(sx(simpson$X[i]),sy(simpson$Y[i]),gray,4.5,sprintf('class="group-point" data-group="%s" opacity=".78"',simpson$G[i]))})
b<-coef(lm(Y~X,simpson)); ba<-coef(lm(Y~X+G,simpson))
layer('pooled',curve(c(0,10),b[1]+b[2]*c(0,10),ink,4,extra='data-draw="true"'))
layer('within',{for(g in 0:1){d<-subset(simpson,G==g);b<-coef(lm(Y~X,d));x<-range(d$X);curve(x,b[1]+b[2]*x,c(blue,orange)[g+1],4,extra='data-draw="true"')}})
layer('adjusted',{for(g in 0:1){x<-if(g==0)c(3,10)else c(0,7);curve(x,ba[1]+ba[2]*x+ba[3]*g,c(blue,orange)[g+1],4,extra='data-draw="true"')}})
layer('compare',{for(g in 0:1){x<-c(4,6);y<-ba[1]+ba[2]*x+ba[3]*g;line(sx(x[1]),sy(y[1]),sx(x[2]),sy(y[1]),c(blue,orange)[g+1],2,'6 5');line(sx(x[2]),sy(y[1]),sx(x[2]),sy(y[2]),c(blue,orange)[g+1],4,extra='data-draw="true"');for(i in 1:2)dot(sx(x[i]),sy(y[i]),'white',7,sprintf('stroke="%s" stroke-width="3"',c(blue,orange)[g+1]))}})
layer('height',{line(sx(2),sy(ba[1]+ba[2]*2),sx(2),sy(ba[1]+ba[2]*2+ba[3]),purple,4,extra='data-draw="true"');txt(sx(2)-14,sy(ba[1]+ba[2]*2+ba[3]/2),'β₂',30,purple,'end')})
finish('simpson')

# Data integrity checks, also exported as the numeric source for the HTML.
stopifnot(nrow(star)==3745,nrow(oats)==72,nrow(simpson)==200)
stopifnot(abs(diff(means)-star_est$slope)<1e-9)
stopifnot(all(reps$cover==as.integer(abs(reps$statistic)<=qnorm(.975))))
for(nn in c(40,240,960))stopifnot(nrow(subset(reps,n==nn))==5000)
observed <- subset(samples,n==240 & replicate==1)
fit<-lm(Y~X,observed);xxc<-observed$X-mean(observed$X)
se<-sqrt(sum(xxc^2*residuals(fit)^2))/sum(xxc^2)
stopifnot(abs(coef(fit)[2]-obs$slope)<1e-10,abs(se-obs$se)<1e-10)
starfit <- lm(Y~D,star); zmat <- model.matrix(starfit)
scores <- rowsum(zmat*residuals(starfit),star$school)
bread <- solve(crossprod(zmat)); ng <- nrow(scores); nr <- nrow(star)
vc <- bread %*% crossprod(scores) %*% bread * ng/(ng-1)*(nr-1)/(nr-ncol(zmat))
stopifnot(abs(sqrt(vc[2,2])-star_est$se)<1e-10)
ofit <- lm(Y~X+factor(mainplot),oats)
ose <- coef(summary(ofit))['X','Std. Error']
stopifnot(abs(coef(ofit)['X']-oats_est$slope)<1e-10,abs(ose-oats_est$se)<1e-10,df.residual(ofit)==53)
stopifnot(abs(coef(ofit)['X']-qt(.975,53)*ose-oats_est$lower)<1e-10)
stopifnot(max(abs(subset(mp,scenario=='linear')$bias))<1e-8)
stopifnot(max(abs(subset(changes,model==1)$diminishing_amount))<1e-8)
stopifnot(abs(coef(lm(Y~X+G,simpson))['X']-3.12845298297447)<1e-10)
localdata <- subset(md,scenario=='curved' & n==50 & replicate==1)
localfit <- lm(Y~X,localdata,weights=exp(-.5*((X-4)/.8)^2))
localcurve <- getcurve('curved',50,3,1)
stopifnot(abs(predict(localfit,data.frame(X=4))-subset(localcurve,X==4)$prediction)<1e-10)
checks <- c(star_n=nrow(star),star_slope=star_est$slope,star_cluster_se=sqrt(vc[2,2]),
 oats_n=nrow(oats),oats_slope=coef(ofit)['X'],oats_se=ose,oats_df=df.residual(ofit),
 inference_slope=obs$slope,inference_HC0_se=se,
 coverage_40=mean(subset(reps,n==40)$cover),coverage_240=mean(subset(reps,n==240)$cover),coverage_960=mean(subset(reps,n==960)$cover),
 diminishing_difference=(m(4)-m(2))-(m(8)-m(6)),cost_change=.34*20,
 simpson_pooled=coef(lm(Y~X,simpson))['X'],simpson_adjusted=coef(lm(Y~X+G,simpson))['X'])
writeLines(paste0('{',paste(sprintf('"%s":%.14g',names(checks),checks),collapse=','),'}'),file.path(out,'numeric-reference.json'))
write.csv(data.frame(n=c(40,240,960),coverage=sapply(c(40,240,960),function(nn)mean(subset(reps,n==nn)$cover))),file.path(out,'coverage.csv'),row.names=FALSE)
writeLines(sprintf('R %s; %s SVG figures; saved input data verified; n=240 slope=%.12f; HC0 SE=%.12f',getRversion(),length(list.files(out,pattern='svg$')),obs$slope,se),file.path(out,'verification.txt'))
cat('Generated',length(list.files(out,pattern='svg$')),'layered SVG figures. Numeric checks passed.\n')
