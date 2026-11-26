# Teaching annotations. Coordinates and shapes are authored in R, like the plots.
# Each named layer is revealed by a specific step in assets/lecture.js.
marker <- '#b83d35'
mark_path <- function(x,y,col=marker,width=3.4) {
 emit(sprintf('<path d="M%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" data-draw="true"/>',paste(paste(f(x),f(y)),collapse=' L'),col,width))
}
ring <- function(x,y,rx,ry,col=marker,angle=0) {
 t <- seq(-.28,2*pi-.12,length.out=100)
 r <- 1+.016*sin(3*t)+.009*cos(5*t)
 a <- rx*cos(t)*r; b <- ry*sin(t)*r
 mark_path(x+a*cos(angle)-b*sin(angle),y+a*sin(angle)+b*cos(angle),col)
}
arrow <- function(x1,y1,x2,y2,col=marker,bend=0,both=FALSE) {
 dx<-x2-x1;dy<-y2-y1;len<-sqrt(dx^2+dy^2);if(len<.1)return(invisible(NULL))
 cx<-(x1+x2)/2-bend*dy/len;cy<-(y1+y2)/2+bend*dx/len
 emit(sprintf('<path d="M%s %s Q%s %s %s %s" fill="none" stroke="%s" stroke-width="3.4" stroke-linecap="round" data-draw="true"/>',f(x1),f(y1),f(cx),f(cy),f(x2),f(y2),col))
 head<-function(x,y,tx,ty){a<-atan2(y-ty,x-tx);size<-min(10,len*.27);mark_path(c(x-size*cos(a-.5),x,x-size*cos(a+.5)),c(y-size*sin(a-.5),y,y-size*sin(a+.5)),col)}
 head(x2,y2,cx,cy);if(both)head(x1,y1,cx,cy)
}
mark <- function(id,expr) {emit(paste0('<g class="board-mark" data-layer="',id,'">'));force(expr);emit('</g>')}
underline <- function(x,y,width,col=marker) mark_path(c(x,x+width*.38,x+width),c(y,y+1.5,y-.7),col)

append_annotations <- function(name) {
 if(name=='star') {
  mark('mark-means',{for(i in 0:1)ring(sx(i),sy(means[i+1]),sx(.19)-sx(0),19);arrow(sx(.50),sy(means[1])-83,sx(.04),sy(means[1])-20,bend=-14)})
  mark('mark-difference',{ring(sx(.50),sy(means[1])+43,115,25);arrow(sx(.83),sy(means[1])+43,sx(1),sy(mean(means))+8,bend=12)})
 }
 if(name %in% c('star-interval','oats-interval')) {
  q<-if(name=='star-interval')star_est else oats_est
  mark('mark-estimate',ring(sx(q$slope),sy(.53),20,21))
  mark('mark-lower',ring(sx(q$lower),sy(.53),18,26))
  mark('mark-inside',{v<-if(name=='star-interval')8 else 13;ring(sx(v),sy(.53),23,28);arrow(sx(v)-92,sy(.53)-79,sx(v)-8,sy(.53)-27,bend=-14)})
 }
 if(name=='oats') {
  x<-60;y<-mean(oats$Y)+oats_est$slope*(x-mean(oats$X))
  mark('mark-slope',{ring(sx(x),sy(y),37,23);arrow(sx(43),sy(3550),sx(x)-10,sy(y)-25,bend=-10)})
 }
 if(name=='projection') {
  mark('mark-gap',{ring(sx(5),sy((m(5)+80)/2),27,30);arrow(sx(6.8),sy(94),sx(5.23),sy(83),bend=-17)})
  b<-subset(reps,n==40&replicate==1)
  mark('mark-fit',{ring(sx(8.5),sy((65+3*8.5+b$intercept+b$slope*8.5)/2),34,26);arrow(sx(7),sy(105),sx(8.3),sy(65+3*8.5)-22,bend=18)})
 }
 if(name=='error')mark('mark-tail',arrow(sx(17),sy(.033),sx(35),sy(.003),bend=14))
 if(name=='sampling')mark('mark-center',{ring(sx(3),466,21,20);arrow(sx(4.1),sy(3.2),sx(3.04),sy(2.8),bend=-15)})
 if(name=='normal')mark('mark-central',{arrow(sx(-1.96),sy(.15),sx(1.96),sy(.15),both=TRUE);ring(sx(0),sy(.22),60,28);txt(sx(0),sy(.22)+9,'95%',30,marker,'middle')})
 if(name=='interval') {
  q<-subset(reps,n==240&replicate==1)
  mark('mark-center',ring(sx(q$slope),sy(.55),20,21))
  mark('mark-se',arrow(sx(q$slope),sy(.55)+26,sx(q$slope+q$se),sy(.55)+26,both=TRUE,col=green))
  mark('mark-width',{arrow(sx(q$slope),sy(.55)-27,sx(q$lower),sy(.55)-27);arrow(sx(q$slope),sy(.55)-27,sx(q$upper),sy(.55)-27)})
  mark('mark-candidate3',ring(sx(3),sy(.55),20,25))
  mark('mark-candidate4',{ring(sx(4),sy(.55),22,26);arrow(sx(q$slope),sy(.55)+85,sx(4),sy(.55)+85,both=TRUE)})
 }
 if(name %in% c('intervals','test-intervals')) {
  q<-subset(reps,n==240&replicate<=30&cover==0)
  mark('mark-misses',{for(i in 1:nrow(q))ring(sx(q$lower[i]),sy(31-q$replicate[i]),21,11)})
 }
 if(name=='curved') {
  for(k in 1:2){a<-c(2,6)[k];b<-a+2;y<-m(c(a,b));col<-c(blue,purple)[k]
   mark(paste0('mark-pair',k),{for(i in 1:2){dot(sx(c(a,b)[i]),sy(y[i]),col,5);ring(sx(c(a,b)[i]),sy(y[i]),15,15,col)}})
   mark(paste0('mark-gain',k),{line(sx(a),sy(y[1]),sx(b),sy(y[1]),col,2,'5 5',extra='data-draw="true"');arrow(sx(b)+23,sy(y[1]),sx(b)+23,sy(y[2]),col,both=TRUE);txt(sx(b)+42,sy(mean(y))+8,sprintf('%.1f 点',diff(y)),25,col)})
  }
  mark('mark-bend',{ring(sx(5),sy(m(5)),57,34);arrow(sx(5.8),sy(98),sx(5.2),sy(m(5))-32,bend=-12)})
 }
 if(name=='local') {
  mark('mark-location',ring(sx(4),466,22,20))
  q<-subset(md,scenario=='curved'&n==50&replicate==1)
  for(k in 1:2){h<-c(1.6,.8)[k];b<-coef(lm(Y~X,q,weights=exp(-.5*((X-4)/h)^2)));yy<-b[1]+b[2]*4
   mark(paste0('mark-local',k),{ring(sx(4),sy(yy),22,22,green);arrow(sx(5.5),sy(99),sx(4.13),sy(yy)-23,green,bend=10)})
  }
 }
 if(name=='curved-repeats') {
  for(j in c(1,3)){
   q<-subset(mp,scenario=='curved'&n==50&model==j);x<-5;e<-approx(q$X,q$expected,x)$y
   mark(paste0('mark-bias',j),{ring(sx(x),sy(mean(c(e,m(x)))),30,28);arrow(sx(x)+11,sy(e),sx(x)+11,sy(m(x)),both=TRUE);arrow(sx(6.6),sy(99),sx(x)+18,sy(m(x))-27,bend=12)})
  }
  for(nn in c(50,200)){
   q<-subset(mc,scenario=='curved'&n==nn&model==3&replicate<=30&abs(X-5)<1e-8);stopifnot(nrow(q)==30)
   yr<-range(q$prediction);pad<-8
   mark(paste0('mark-variation',nn),{line(sx(5),432,sx(5),sy(max(yr))-20,gray,1.5,'4 5');for(v in q$prediction)dot(sx(5),sy(v),purple,3.6);ring(sx(5),sy(mean(yr)),21,abs(diff(sy(yr)))/2+pad,purple);arrow(sx(5)+34,sy(yr[1]),sx(5)+34,sy(yr[2]),purple,both=TRUE)})
  }
 }
 if(name=='linear')mark('mark-cost',{ring(sx(100),sy(54),16,16);ring(sx(120),sy(60.8),16,16);arrow(sx(120)+23,sy(54),sx(120)+23,sy(60.8),both=TRUE)})
 if(name=='linear-repeats')mark('mark-line',ring(sx(120),sy(60.8),52,26))
 if(name=='gains') {
  mark('mark-zero',ring(sx(0),466,22,21))
  mark('mark-target',{ring(sx(4.8),sy(.1),21,95);arrow(sx(13),sy(.15),sx(6.2),sy(.14),bend=-10)})
 }
 if(name=='overfit') {
  q<-subset(md,scenario=='linear'&n==50&replicate==1&X>=145);lo<-q[which.min(q$Y),]
  mark('mark-training',{ring(sx(lo$X),sy(lo$Y),21,21);arrow(sx(138),sy(55),sx(lo$X)-24,sy(lo$Y),bend=10)})
  x<-q$X[which.max(q$Y_unused)];obs<-q$Y_unused[which.max(q$Y_unused)];fit<-getcurve('linear',50,3,1);pred<-approx(fit$X,fit$prediction,x)$y
  mark('mark-prediction',{ring(sx(x),sy(obs),20,22);arrow(sx(x)-15,sy(pred),sx(x)-15,sy(obs),both=TRUE)})
 }
 if(name=='simpson') {
  pooled<-coef(lm(Y~X,simpson));adjusted<-coef(lm(Y~X+G,simpson))
  mark('mark-pooled',arrow(sx(3),sy(pooled[1]+pooled[2]*3)+20,sx(7),sy(pooled[1]+pooled[2]*7)+20,bend=4))
  mark('mark-groups',{for(g in 0:1){q<-subset(simpson,G==g);ring(sx(mean(q$X)),sy(mean(q$Y)),235,49,c(blue,orange)[g+1],angle=-.32)}})
  mark('mark-within',{for(g in 0:1){q<-subset(simpson,G==g);b<-coef(lm(Y~X,q));x<-if(g==0)c(5,8)else c(2,5);arrow(sx(x[1]),sy(b[1]+b[2]*x[1])-19,sx(x[2]),sy(b[1]+b[2]*x[2])-19,c(blue,orange)[g+1])}})
  mark('mark-height',{x<-2;y<-adjusted[1]+adjusted[2]*x;arrow(sx(x)+14,sy(y),sx(x)+14,sy(y+adjusted[3]),purple,both=TRUE);ring(sx(x)-27,sy(y+adjusted[3]/2)-6,28,24,purple)})
  mark('mark-within-pairs',{for(g in 0:1){x<-c(4,6);y<-adjusted[1]+adjusted[2]*x+adjusted[3]*g;col<-c(blue,orange)[g+1];for(i in 1:2)ring(sx(x[i]),sy(y[i]),16,16,col);arrow(sx(6)+24,sy(y[1]),sx(6)+24,sy(y[2]),col,both=TRUE)}})
 }
}

# Reusable pen shapes around HTML terms. Browser positions them with CSS only.
write_ink_templates <- function(){
 saved<-buf;buf<<-character();ring(50,30,46,24,'currentColor');circle<-paste(buf,collapse='')
 buf<<-character();underline(3,52,94,'currentColor');under<-paste(buf,collapse='')
 quotejson<-function(x)paste0('"',gsub('"','\\"',x,fixed=TRUE),'"')
 writeLines(paste0('{"circle":',quotejson(circle),',"underline":',quotejson(under),'}'),file.path(out,'ink-templates.json'),useBytes=TRUE)
 buf<<-saved
}
